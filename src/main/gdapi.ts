import { t } from '../shared/strings'
import type { DemonlistListType, LevelSearchQuery } from '../shared/types'

const BASE = 'https://api.demonlist.org'
const TIMEOUT_MS = 20_000

export class GdApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GdApiError'
  }
}

type Params = Record<string, string | number | boolean | null | undefined>

async function api<T>(pathname: string, params?: Params): Promise<T> {
  const url = new URL(pathname, BASE)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' }
    })
  } catch (error) {
    const reason = (error as Error).name === 'AbortError' ? 'превышено время ожидания' : (error as Error).message
    throw new GdApiError(t('Не удалось связаться с api.demonlist.org ({reason})', { reason }))
  } finally {
    clearTimeout(timer)
  }

  const text = await response.text()
  let body: { message?: string; data?: T } | null = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }

  if (!response.ok || !body || body.message !== 'success') {
    const raw = body?.message && body.message !== 'success' ? body.message : `HTTP ${response.status}`
    throw new GdApiError(humanizeApiMessage(raw))
  }

  return body.data as T
}

function humanizeApiMessage(message: string): string {
  switch (message) {
    case 'user_not_found':
      return t('Пользователь не найден на Global Demonlist')
    case 'level_not_found':
      return t('Уровень не найден на Global Demonlist')
    case 'invalid_level_parameters':
      return t('API не понял параметры запроса уровня')
    case 'invalid_date':
      return t('Некорректная дата')
    default:
      return message
  }
}

export interface GdLevelListItem {
  id: number
  ingame_id: number
  placement: number
  name: string
  points: string | number
  list_percent: number
  length: number
  objects: number
  holder: string
  verifier: { user_id: number; username: string }
  verification_url: string
  date_created: string
}

export interface GdLevelDetail {
  id: number
  ingame_id: number
  placement: number
  name: string
  points: string | number
  list_percent: number
  length: number
  objects: number
  description: string | null
  creator: string
  holder: string
  song_url: string | null
  game_version: number
  verification: { user_id: number; username: string; video_url: string }
  copy_info: { is_copyable: boolean; password: string | null }
  date_created: string
}

export interface GdUserListItem {
  id: number
  username: string
  placement: number
  points: string | number
  country: string
  badge: string
}

export interface GdUserRecord {
  id: number
  name: string
  placement: number
  video_url: string | null
}

export interface GdUserProgress extends GdUserRecord {
  percent: number
}

export interface GdUser {
  username: string
  placement: number
  points: string | number
  country: string
  badge: string
  is_banned: boolean
  levels: {
    hardest: GdUserRecord | null
    main: GdUserRecord[] | null
    extended: GdUserRecord[] | null
    advanced: GdUserRecord[] | null
    unbounded: GdUserRecord[] | null
    progress: GdUserProgress[] | null
    verified: GdUserRecord[] | null
    uncompleted: GdUserRecord[] | null
  }
}

export async function listLevels(query: LevelSearchQuery): Promise<GdLevelListItem[]> {
  const data = await api<{ levels: GdLevelListItem[] }>('/level/classic/list', {
    search: query.search,
    list_type: query.listType || undefined,
    limit: query.limit ?? 40,
    offset: query.offset ?? 0,
    natural_ordering: false
  })
  return data.levels ?? []
}

export async function getLevel(id: number): Promise<GdLevelDetail> {
  return api<GdLevelDetail>('/level/classic/get', { id })
}

/**
 * Все уровни Global Demonlist по листам: Main, Extended, Advanced, Unbounded.
 *
 * Нужна, чтобы добавить в план то, что игрок ещё не прошёл: в профиле такие
 * уровни не приходят (поле `uncompleted` API не наполняет), поэтому берём их
 * из самого листа и вычитаем то, что уже есть в профиле.
 */
export async function listAllClassicLevels(): Promise<GdLevelListItem[]> {
  const lists: DemonlistListType[] = ['main', 'extended', 'advanced', 'unbounded']
  const collected: GdLevelListItem[][] = await Promise.all(
    lists.map(async (listType) => {
      const levels: GdLevelListItem[] = []
      // В листе не больше 150 уровней, но пагинацию оставляем на случай роста.
      for (let offset = 0; offset < 600; offset += 200) {
        const page = await listLevels({ listType, limit: 200, offset })
        levels.push(...page)
        if (page.length < 200) break
      }
      return levels
    })
  )
  const byId = new Map<number, GdLevelListItem>()
  for (const level of collected.flat()) {
    if (typeof level?.id === 'number') byId.set(level.id, level)
  }
  // Порядок листа — от сложных к простым; без позиции уровень уходит в конец.
  return [...byId.values()].sort((a, b) => {
    const pa = Number.isFinite(a.placement) ? a.placement : Number.MAX_SAFE_INTEGER
    const pb = Number.isFinite(b.placement) ? b.placement : Number.MAX_SAFE_INTEGER
    return pa === pb ? a.id - b.id : pa - pb
  })
}

export async function searchUsers(search: string): Promise<GdUserListItem[]> {
  const data = await api<{ users: GdUserListItem[] }>('/leaderboard/user/list', {
    search,
    limit: 25
  })
  return data.users ?? []
}

export async function getUser(id: number): Promise<GdUser> {
  return api<GdUser>('/user/get', { id })
}

export function userProfileUrl(username: string): string {
  return `https://demonlist.org/${encodeURIComponent(username)}/`
}
