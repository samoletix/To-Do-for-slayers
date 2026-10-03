import {
  STAGES,
  THEME_IDS,
  type AppData,
  type AppSettings,
  type LevelDraft,
  type LevelPlan,
  type Stage,
  type ThemeId
} from './types'

export const DATA_VERSION = 6

export const DEFAULT_SCALE = 2

export const SCALE_OPTIONS = [1, 1.25, 1.5, 1.75, 2] as const

export const DEFAULT_STAGE_COLORS: Record<Stage, string> = {
  completed: '#35f0a0',
  in_progress: '#ffb020',
  planned: '#4da6ff',
  frozen: '#46e0e0',
  dream: '#b48bff',
  dead: '#ff5470'
}

/** Шрифты, которые почти всегда есть в Windows. Полный список main-процесс читает из папки Fonts. */
export const COMMON_FONTS = [
  'Segoe UI',
  'Segoe UI Variable',
  'Arial',
  'Arial Narrow',
  'Calibri',
  'Cambria',
  'Candara',
  'Comic Sans MS',
  'Consolas',
  'Constantia',
  'Corbel',
  'Cascadia Code',
  'Cascadia Mono',
  'Franklin Gothic Medium',
  'Gabriola',
  'Georgia',
  'Impact',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Malgun Gothic',
  'Microsoft JhengHei',
  'Microsoft Sans Serif',
  'MS Gothic',
  'MV Boli',
  'Palatino Linotype',
  'Segoe Print',
  'Segoe Script',
  'Segoe UI Emoji',
  'Segoe UI Historic',
  'Segoe UI Semibold',
  'Sitka',
  'Sylfaen',
  'Symbol',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Webdings',
  'Wingdings'
]

export function defaultSettings(): AppSettings {
  return {
    theme: 'modern',
    sortMode: 'gdl',
    language: 'ru',
    lastSyncInput: '',
    scale: DEFAULT_SCALE,
    compact: false,
    stageColors: { ...DEFAULT_STAGE_COLORS },
    backgroundColor: '',
    panelColor: '',
    objectColor: '',
    buttonColor: '',
    textColor: '',
    backgroundImage: '',
    fontFamily: ''
  }
}

export function defaultData(): AppData {
  return {
    version: DATA_VERSION,
    settings: defaultSettings(),
    levels: []
  }
}

export function emptyDraft(): LevelDraft {
  return {
    name: '',
    source: 'custom',
    demonlistId: null,
    ingameId: null,
    placement: null,
    creator: '',
    verifier: '',
    videoUrl: '',
    previewPath: '',
    difficulty: '',
    popularity: '',
    attempts: null,
    progress: '',
    stage: 'planned',
    comment: ''
  }
}

const STAGES_SET = new Set<Stage>(STAGES)

function str(value: unknown): string {
  return typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value)
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/** Фановость — свободный текст, поэтому режем только длину и крайние пробелы. */
function normalizePopularity(value: unknown): string {
  return str(value).replace(/\s+/g, ' ').trim().slice(0, 200)
}

/** Принимает `#rgb`, `#rrggbb`; всё прочее — пустая строка (значит «по умолчанию»). */
export function normalizeColor(value: unknown, fallback: string): string {
  const raw = str(value).trim()
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    const [, r, g, b] = raw
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return fallback
}

/** Путь к файлу внутри папки данных: без диска, без `..`. */
function safeRelativePath(value: unknown): string {
  const raw = str(value).trim().replace(/\\/g, '/')
  if (!raw) return ''
  if (raw.startsWith('/') || /^[a-z]:/i.test(raw) || raw.includes('..')) return ''
  return raw.slice(0, 300)
}

/** Неотрицательное целое или null. */
function natural(value: unknown): number | null {
  const n = num(value)
  if (n === null) return null
  if (n < 0) return null
  return Math.round(n)
}

const THEME_SET = new Set<string>(THEME_IDS)

/**
 * Светлой и тёмной темы больше нет — вместо них шаблоны оформления.
 * Старое `dark` становится Modern Dark UI, `light` — Material Design.
 */
function normalizeTheme(value: unknown): ThemeId {
  const raw = str(value).trim()
  if (raw === 'dark') return 'modern'
  if (raw === 'light') return 'material'
  return THEME_SET.has(raw) ? (raw as ThemeId) : 'modern'
}

function normalizeSettings(raw: unknown): AppSettings {
  const base = defaultSettings()
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const settings: AppSettings = {
    ...base,
    theme: normalizeTheme(input.theme),
    sortMode: input.sortMode === 'manual' ? 'manual' : 'gdl',
    language: input.language === 'en' ? 'en' : 'ru',
    lastSyncInput: str(input.lastSyncInput),
    compact: input.compact === true,
    backgroundColor: normalizeColor(input.backgroundColor, ''),
    panelColor: normalizeColor(input.panelColor, ''),
    objectColor: normalizeColor(input.objectColor, ''),
    buttonColor: normalizeColor(input.buttonColor, ''),
    textColor: normalizeColor(input.textColor, ''),
    backgroundImage: safeRelativePath(input.backgroundImage),
    fontFamily: str(input.fontFamily).slice(0, 120)
  }

  const rawScale = num(input.scale)
  const maxScale = SCALE_OPTIONS[SCALE_OPTIONS.length - 1]
  settings.scale =
    rawScale === null || rawScale < 0.5 || rawScale > maxScale
      ? DEFAULT_SCALE
      : Math.round(rawScale * 100) / 100

  const colors = { ...base.stageColors }
  const inputColors = (input.stageColors && typeof input.stageColors === 'object'
    ? input.stageColors
    : {}) as Record<string, unknown>
  for (const stage of STAGES) {
    colors[stage] = normalizeColor(inputColors[stage], DEFAULT_STAGE_COLORS[stage])
  }
  settings.stageColors = colors

  return settings
}

function normalize(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') return defaultData()
  const data = raw as Partial<AppData>

  const now = new Date().toISOString()
  const source = Array.isArray(data.levels) ? data.levels.filter((l) => !!l && typeof l === 'object') : []

  const levels: LevelPlan[] = source.map((l, index) => {
    const stage = STAGES_SET.has(l.stage) ? l.stage : 'planned'
    const createdAt = str(l.createdAt) || now
    const order = num((l as LevelPlan).order)
    return {
      id: str(l.id) || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: str(l.name) || 'Без названия',
      source: l.source === 'custom' ? 'custom' : 'demonlist',
      demonlistId: num(l.demonlistId),
      ingameId: num(l.ingameId),
      placement: num(l.placement),
      creator: str(l.creator),
      verifier: str(l.verifier),
      videoUrl: str(l.videoUrl),
      previewPath: str(l.previewPath),
      difficulty: str(l.difficulty),
      popularity: normalizePopularity(l.popularity),
      attempts: natural(l.attempts),
      progress: str(l.progress).trim(),
      stage,
      comment: str(l.comment),
      order: order === null ? index : Math.round(order),
      createdAt,
      updatedAt: str(l.updatedAt) || createdAt
    }
  })

  return {
    version: DATA_VERSION,
    settings: normalizeSettings(data.settings),
    levels
  }
}

export { normalize }
