import { dateLocale, t } from '@shared/strings'
import { DEFAULT_STAGE_COLORS } from '@shared/defaults'
import {
  stageLabelKey,
  type AppSettings,
  type Language,
  type LevelPlan,
  type SortMode,
  type Stage
} from '@shared/types'

export function uid(): string {
  const cryptoRef = globalThis.crypto
  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') return cryptoRef.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function todayISO(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function nowISO(): string {
  return new Date().toISOString()
}

let locale = 'ru-RU'

/** Локаль для дат следует за языком интерфейса. */
export function setLocale(language: Language): void {
  locale = dateLocale(language)
}

function formatDate(value: string): string {
  if (!value) return '—'
  const date = value.length > 10 ? new Date(value) : new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatWhen(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diff = Date.now() - date.getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин назад`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.round(hours / 24)
  if (days === 1) return 'вчера'
  if (days < 31) return `${days} дн назад`
  return formatDate(value)
}

export function stageLabel(stage: Stage): string {
  return t(stageLabelKey(stage))
}

export const STAGE_COLORS: Record<Stage, string> = DEFAULT_STAGE_COLORS

/** Цвета статусов из настроек — их пользователь может менять. */
export function stageColors(settings: AppSettings | null): Record<Stage, string> {
  return settings?.stageColors ?? STAGE_COLORS
}

/** Числовой прогресс из строки вроде "27-100", "99.96%", "75". */
export function progressValue(raw: string): number | null {
  const match = raw.trim().match(/-?\d+(?:[.,]\d+)?/)
  if (!match) return null
  const n = Number(match[0].replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function errorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error)
  return raw
    .replace(/^Error invoking remote method '[^']*':\s*/, '')
    .replace(/^Error:\s*/, '')
    .trim()
}

export function demonlistLevelUrl(level: LevelPlan): string | null {
  if (level.source === 'demonlist' && level.demonlistId) {
    return `https://demonlist.org/classic/${level.demonlistId}`
  }
  return null
}

export function ingameLevelUrl(ingameId: number | null): string | null {
  return ingameId ? `https://www.geometrydash.com/game/#!1/${ingameId}` : null
}

/** ID ролика YouTube из любой ссылки (watch, youtu.be, shorts, embed). */
export function youtubeId(url: string): string | null {
  if (!url) return null
  const raw = url.trim()
  if (/^[\w-]{11}$/.test(raw)) return raw
  const patterns = [
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/i,
    /youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/i,
    /youtube\.com\/shorts\/([\w-]{11})/i,
    /youtube\.com\/live\/([\w-]{11})/i
  ]
  for (const pattern of patterns) {
    const match = raw.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function youtubeThumbnail(url: string): string | null {
  const id = youtubeId(url)
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null
}

/** Порядок, заданный пользователем перетаскиванием строк. */
export function sortByOrder(levels: LevelPlan[]): LevelPlan[] {
  return [...levels].sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name, 'ru') || (a.id < b.id ? -1 : 1)
  )
}

/**
 * Порядок по умолчанию: по позиции в Global Demonlist.
 * Уровни без позиции стоят выше, и среди них свежие выше старых.
 */
export function sortByGdl(levels: LevelPlan[]): LevelPlan[] {
  const byName = (a: LevelPlan, b: LevelPlan): number =>
    a.name.localeCompare(b.name, 'ru') || (a.id < b.id ? -1 : 1)
  const placed = levels
    .filter((level) => level.placement !== null)
    .sort((a, b) => (a.placement as number) - (b.placement as number) || byName(a, b))
  const unplaced = levels
    .filter((level) => level.placement === null)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : byName(a, b)))
  return [...unplaced, ...placed]
}

export function sortLevels(levels: LevelPlan[], mode: SortMode): LevelPlan[] {
  return mode === 'manual' ? sortByOrder(levels) : sortByGdl(levels)
}

/**
 * Переставляет `movedId` на позицию `targetIndex` среди видимых строк.
 * Скрытые строки (поиск, фильтры) остаются на своих местах.
 */
export function reorderLevels(
  levels: LevelPlan[],
  visibleIds: string[],
  movedId: string,
  targetIndex: number
): LevelPlan[] {
  const visible = new Set(visibleIds)
  if (!visible.has(movedId)) return levels

  const base = sortByOrder(levels)
  const slots: number[] = []
  base.forEach((level, index) => {
    if (visible.has(level.id)) slots.push(index)
  })

  const sequence = base.filter((level) => visible.has(level.id) && level.id !== movedId).map((l) => l.id)
  const target = Math.max(0, Math.min(slots.length - 1, targetIndex))
  sequence.splice(target, 0, movedId)

  const byId = new Map(base.map((level) => [level.id, level]))
  const next = [...base]
  slots.forEach((slot, index) => {
    const level = byId.get(sequence[index])
    if (level) next[slot] = level
  })

  // Порядок всегда равен индексу — так он не расходится после перезапуска.
  return next.map((level, index) => (level.order === index ? level : { ...level, order: index }))
}

/**
 * Фиксирует текущий видимый порядок как ручной.
 *
 * Пока сортировка по позиции в GDL, поле `order` может не совпадать с тем,
 * что пользователь видит. Поэтому перед любым ручным перемещением ряд
 * нумеруется заново — иначе уровень встанет не туда, куда его показали.
 */
export function freezeVisibleOrder(levels: LevelPlan[], visibleIds: string[]): LevelPlan[] {
  const rank = new Map(visibleIds.map((id, index) => [id, index]))
  const sorted = [...levels].sort((a, b) => {
    const ra = rank.get(a.id)
    const rb = rank.get(b.id)
    if (ra !== undefined && rb !== undefined) return ra - rb
    if (ra !== undefined) return -1
    if (rb !== undefined) return 1
    return a.order - b.order
  })
  return sorted.map((level, index) => (level.order === index ? level : { ...level, order: index }))
}

/**
 * Ставит уровень на номер, введённый пользователем.
 * Нумерация считается по видимым строкам, скрытые остаются на своих местах.
 */
export function moveLevelToNumber(
  levels: LevelPlan[],
  visibleIds: string[],
  movedId: string,
  number: number
): LevelPlan[] {
  const target = Math.max(1, Math.round(number)) - 1
  if (target >= visibleIds.length) return reorderLevels(levels, visibleIds, movedId, visibleIds.length - 1)
  return reorderLevels(levels, visibleIds, movedId, target)
}

export function matchesQuery(level: LevelPlan, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    level.name,
    level.creator,
    level.verifier,
    level.comment,
    level.difficulty,
    level.progress,
    level.placement?.toString() ?? '',
    level.ingameId?.toString() ?? '',
    level.attempts?.toString() ?? ''
  ]
    .join(' ')
    .toLowerCase()
  return q.split(/\s+/).every((token) => haystack.includes(token))
}

export function parsePlacementId(input: string): number | null {
  const raw = input.trim()
  if (!raw) return null
  const fromUrl = raw.match(/demonlist\.org\/(?:level|classic)\/(\d+)/i)
  if (fromUrl) return Number(fromUrl[1])
  const numeric = raw.match(/^#?(\d+)$/)
  if (numeric) return Number(numeric[1])
  return null
}

export function parseIngameId(input: string): number | null {
  const raw = input.trim()
  if (!raw) return null
  const fromUrl = raw.match(/geometrydash\.com\/game\/#!1\/(\d+)/i)
  if (fromUrl) return Number(fromUrl[1])
  const numeric = raw.match(/^#?(\d+)$/)
  return numeric ? Number(numeric[1]) : null
}

const assetCache = new Map<string, string>()

/** Локальный файл (превью или шрифт) как data:URL. Кэш живёт до перезапуска. */
export async function assetDataUrl(relative: string): Promise<string | null> {
  if (!relative) return null
  const cached = assetCache.get(relative)
  if (cached) return cached
  try {
    const url = await window.api.readAsset(relative)
    assetCache.set(relative, url)
    return url
  } catch {
    return null
  }
}
