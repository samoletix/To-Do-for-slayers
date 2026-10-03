import { randomUUID } from 'node:crypto'
import { t } from '../shared/strings'
import type { LevelPlan, Stage, SyncChangedLevel, SyncResult } from '../shared/types'
import {
  GdApiError,
  getLevel,
  getUser,
  listAllClassicLevels,
  searchUsers,
  userProfileUrl,
  type GdLevelDetail,
  type GdUser,
  type GdUserRecord
} from './gdapi'

export interface SyncUserOptions {
  input: string
  existing: LevelPlan[]
  addNew: boolean
  fetchDetails: boolean
  /** Добирать из Global Demonlist уровни, которых ещё нет в профиле игрока. */
  addUncompleted?: boolean
}

interface Entry {
  id: number
  name: string
  placement: number | null
  videoUrl: string
  percent: number | null
  /** Уровень есть в листе, но игрок его ещё не прошёл. */
  uncompleted?: boolean
}

const PROTECTED_STAGES: Stage[] = ['frozen', 'dream', 'dead']
const CONQUERABLE: Stage[] = ['planned', 'in_progress']

function progressValue(raw: string): number | null {
  const match = raw.trim().match(/-?\d+(?:[.,]\d+)?/)
  if (!match) return null
  const n = Number(match[0].replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function nowIso(): string {
  return new Date().toISOString()
}

function normalizePlacement(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function toPoints(value: string | number): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    for (;;) {
      const index = cursor++
      if (index >= items.length) return
      results[index] = await fn(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

export async function resolveUser(input: string): Promise<{ id: number; user: GdUser }> {
  const raw = input.trim()
  if (!raw) throw new GdApiError(t('Введите ник, ID или ссылку на профиль Global Demonlist'))

  let numericId: number | null = null
  let username: string | null = null

  const looksLikeLink = /^https?:\/\//i.test(raw) || raw.includes('/')
  if (looksLikeLink) {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    let parsed: URL | null = null
    try {
      parsed = new URL(candidate)
    } catch {
      parsed = null
    }
    if (!parsed) throw new GdApiError(t('Не удалось разобрать ссылку: {input}', { input: raw }))
    const segments = parsed.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    if (segments.includes('user') && last && /^\d+$/.test(last)) {
      numericId = Number(last)
    } else if (last && /^\d+$/.test(last)) {
      numericId = Number(last)
    } else if (last) {
      username = decodeURIComponent(last)
    }
  } else if (/^#?\d+$/.test(raw)) {
    numericId = Number(raw.replace('#', ''))
  } else {
    username = raw
  }

  if (numericId === null && username === null) {
    throw new GdApiError(t('Не удалось определить пользователя из «{input}»', { input: raw }))
  }

  if (numericId === null) {
    const users = await searchUsers(username as string)
    if (users.length === 0) {
      throw new GdApiError(
        t('Пользователь «{name}» не найден на Global Demonlist', { name: username as string })
      )
    }
    const exact = users.find((u) => u.username.toLowerCase() === (username as string).toLowerCase())
    numericId = (exact ?? users[0]).id
  }

  return { id: numericId, user: await getUser(numericId) }
}

function collectEntries(user: GdUser): Entry[] {
  const byId = new Map<number, Entry>()
  const levels = user.levels ?? ({} as GdUser['levels'])

  const addCompleted = (records: GdUserRecord[] | null): void => {
    for (const record of records ?? []) {
      if (!record || typeof record.id !== 'number') continue
      const existing = byId.get(record.id)
      if (existing) {
        if (!existing.videoUrl && record.video_url) existing.videoUrl = record.video_url
        continue
      }
      byId.set(record.id, {
        id: record.id,
        name: record.name,
        placement: normalizePlacement(record.placement),
        videoUrl: record.video_url ?? '',
        percent: 100
      })
    }
  }

  addCompleted(levels.verified)
  addCompleted(levels.main)
  addCompleted(levels.extended)
  addCompleted(levels.advanced)
  addCompleted(levels.unbounded)
  addCompleted(levels.hardest ? [levels.hardest] : null)

  for (const record of levels.progress ?? []) {
    if (!record || typeof record.id !== 'number') continue
    if (byId.has(record.id)) continue
    const percent = Math.min(99, Math.max(0, Math.round(Number(record.percent) || 0)))
    byId.set(record.id, {
      id: record.id,
      name: record.name,
      placement: normalizePlacement(record.placement),
      videoUrl: record.video_url ?? '',
      percent
    })
  }

  // `uncompleted` в профиле API не наполняет, но если он когда-то появится —
  // не теряем эти уровни.
  for (const record of levels.uncompleted ?? []) {
    if (!record || typeof record.id !== 'number') continue
    const existing = byId.get(record.id)
    if (existing) continue
    byId.set(record.id, {
      id: record.id,
      name: record.name,
      placement: normalizePlacement(record.placement),
      videoUrl: record.video_url ?? '',
      percent: null,
      uncompleted: true
    })
  }

  return [...byId.values()]
}

/**
 * Добирает из Global Demonlist уровни, которых игрок ещё не прошёл.
 * В профиле их нет, поэтому список листа вычитается из профиля.
 */
async function collectUncompleted(user: GdUser): Promise<Entry[]> {
  const done = new Set<number>()
  const levels = user.levels ?? ({} as GdUser['levels'])
  for (const group of [levels.main, levels.extended, levels.advanced, levels.unbounded, levels.verified]) {
    for (const record of group ?? []) {
      if (record && typeof record.id === 'number') done.add(record.id)
    }
  }
  for (const record of levels.progress ?? []) {
    if (record && typeof record.id === 'number') done.add(record.id)
  }
  if (levels.hardest && typeof levels.hardest.id === 'number') done.add(levels.hardest.id)

  const list = await listAllClassicLevels()
  return list
    .filter((level) => !done.has(level.id))
    .map((level) => ({
      id: level.id,
      name: level.name,
      placement: normalizePlacement(level.placement),
      videoUrl: '',
      percent: null,
      uncompleted: true
    }))
}

/** Обновляет технические поля уровня. video_url из verification НЕ берётся:
 *  это ролик верификатора, а нужен ролик прохождения самого слеера. */
function applyDetail(level: LevelPlan, detail: GdLevelDetail): void {
  level.name = detail.name || level.name
  level.ingameId = detail.ingame_id ?? level.ingameId
  level.placement = normalizePlacement(detail.placement) ?? level.placement
  level.creator = detail.creator ?? ''
  level.verifier = detail.verification?.username ?? ''
  level.demonlistId = detail.id ?? level.demonlistId
}

export async function syncUser(options: SyncUserOptions): Promise<SyncResult> {
  const { id: userId, user } = await resolveUser(options.input)
  const entries = collectEntries(user)
  let uncompletedFetched = 0
  if (options.addNew && options.addUncompleted !== false) {
    try {
      for (const entry of await collectUncompleted(user)) {
        if (entries.some((item) => item.id === entry.id)) continue
        entries.push(entry)
        uncompletedFetched += 1
      }
    } catch {
      // Лист не отдали — синхронизация всё равно идёт по профилю.
    }
  }
  const existing = options.existing ?? []

  const byDemonlistId = new Map<number, LevelPlan>()
  for (const level of existing) {
    if (level.demonlistId !== null) byDemonlistId.set(level.demonlistId, level)
  }

  const newEntries = entries.filter((entry) => !byDemonlistId.has(entry.id))

  // Детали нужны только для уровней из профиля: докачивать сотни запросов
  // ради всего листа долго, а имя, позиция и ID там уже есть.
  const detailed = newEntries.filter((entry) => !entry.uncompleted)
  const details = new Map<number, GdLevelDetail>()
  let detailsFailed = 0
  if (options.fetchDetails && detailed.length > 0) {
    const fetched = await mapLimit(detailed, 6, async (entry) => {
      try {
        return await getLevel(entry.id)
      } catch {
        detailsFailed += 1
        return null
      }
    })
    fetched.forEach((detail, index) => {
      if (detail) details.set(detailed[index].id, detail)
    })
  }

  const added: SyncChangedLevel[] = []
  const updated: SyncChangedLevel[] = []
  const skipped: string[] = []
  const stamp = nowIso()

  for (const entry of entries) {
    const current = byDemonlistId.get(entry.id)
    const detail = details.get(entry.id)

    if (!current) {
      if (!options.addNew) {
        skipped.push(entry.name)
        continue
      }
      const level: LevelPlan = {
        id: randomUUID(),
        name: entry.name,
        source: 'demonlist',
        demonlistId: entry.id,
        ingameId: null,
        placement: entry.placement,
        creator: '',
        verifier: '',
        videoUrl: entry.videoUrl,
        previewPath: '',
        difficulty: '',
        popularity: '',
        attempts: null,
        progress: entry.percent === null ? '' : `${entry.percent}%`,
        stage: entry.percent === 100 ? 'completed' : entry.percent === null ? 'planned' : 'in_progress',
        comment: '',
        order: existing.length,
        createdAt: stamp,
        updatedAt: stamp
      }
      if (detail) applyDetail(level, detail)
      existing.push(level)
      byDemonlistId.set(entry.id, level)
      added.push({ name: level.name, stage: level.stage, progress: level.progress })
      continue
    }

    let touched = false

    if (detail) {
      const before = `${current.creator}|${current.verifier}|${current.placement}|${current.ingameId}|${current.videoUrl}`
      applyDetail(current, detail)
      const after = `${current.creator}|${current.verifier}|${current.placement}|${current.ingameId}|${current.videoUrl}`
      touched = before !== after
    } else {
      if (entry.placement !== null) {
        touched = touched || current.placement !== entry.placement
        current.placement = entry.placement
      }
      if (entry.videoUrl && current.videoUrl !== entry.videoUrl) {
        touched = true
        current.videoUrl = entry.videoUrl
      }
    }

    // Статусы «Заморожен», «Мечта» и «Мёртв» — личное решение, их синхронизация не трогает.
    if (!PROTECTED_STAGES.includes(current.stage)) {
      if (entry.percent === 100) {
        if (CONQUERABLE.includes(current.stage)) {
          current.stage = 'completed'
          current.progress = '100%'
          touched = true
        } else if (current.progress !== '100%') {
          current.progress = '100%'
          touched = true
        }
      } else if (entry.percent !== null && current.stage === 'planned') {
        current.stage = 'in_progress'
        current.progress = `${entry.percent}%`
        touched = true
      } else if (entry.percent !== null && current.stage === 'in_progress') {
        const currentValue = progressValue(current.progress)
        const next = Math.max(currentValue ?? 0, entry.percent)
        if (currentValue === null || next > currentValue) {
          current.progress = `${next}%`
          touched = true
        }
      }
    } else {
      skipped.push(current.name)
    }

    if (touched) {
      current.updatedAt = stamp
      updated.push({ name: current.name, stage: current.stage, progress: current.progress })
    }
  }

  const completedTotal = entries.filter((e) => e.percent === 100).length
  const progressTotal = entries.filter((e) => e.percent !== null && e.percent !== 100).length
  const uncompletedTotal = entries.filter((e) => e.percent === null).length

  return {
    levels: existing,
    report: {
      username: user.username,
      profileUrl: userProfileUrl(user.username),
      userId,
      placement: normalizePlacement(user.placement),
      points: toPoints(user.points),
      added,
      updated,
      skipped: [...new Set(skipped)],
      completedTotal,
      progressTotal,
      uncompletedTotal,
      uncompletedFetched,
      detailsFailed,
      message: buildMessage(added.length, updated.length, skipped.length)
    }
  }
}

function buildMessage(added: number, updated: number, skipped: number): string {
  const parts: string[] = []
  if (added) parts.push(t('Добавлено {n}', { n: added }))
  if (updated) parts.push(t('Обновлено {n}', { n: updated }))
  if (skipped) parts.push(t('Пропущено защищённых статусов: {n}', { n: skipped }))
  return parts.length ? parts.join(', ') : t('изменений нет')
}
