export type Stage = 'completed' | 'in_progress' | 'planned' | 'frozen' | 'dream' | 'dead'

export const STAGES: Stage[] = [
  'completed',
  'in_progress',
  'planned',
  'frozen',
  'dream',
  'dead'
]

export const STAGE_KEYS: Record<Stage, string> = {
  completed: 'Пройден',
  in_progress: 'В процессе',
  planned: 'Планируется',
  frozen: 'Заморожен',
  dream: 'Мечта',
  dead: 'Мёртв'
}

/** Ключ надписи для статуса — чтобы он попал в strings.txt. */
export function stageLabelKey(stage: Stage): string {
  return STAGE_KEYS[stage]
}

export type LevelSource = 'demonlist' | 'custom'

export interface LevelPlan {
  id: string
  name: string
  source: LevelSource
  demonlistId: number | null
  ingameId: number | null
  placement: number | null
  creator: string
  verifier: string
  videoUrl: string
  /** Файл кастомного превью относительно папки данных, например `previews/1a2b.png`. */
  previewPath: string
  difficulty: string
  /** Фановость — произвольный текст: «95%», «топ», «легенда» и что угодно ещё. */
  popularity: string
  /** Сколько попыток ушло на уровень; null — неизвестно. */
  attempts: number | null
  progress: string
  stage: Stage
  comment: string
  /** Порядок строки в списке; задаётся перетаскиванием или вводом номера. */
  order: number
  createdAt: string
  updatedAt: string
}

/** `gdl` — по позиции в Global Demonlist, `manual` — порядок, заданный пользователем. */
export type SortMode = 'gdl' | 'manual'

export type Language = 'ru' | 'en'

/** Шаблоны оформления. Светлой/тёмной темы больше нет — только готовые наборы. */
export type ThemeId =
  | 'modern'
  | 'glass'
  | 'neumorphism'
  | 'retro'
  | 'material'
  | 'synthwave'
  | 'clay'
  | 'minimal'
  | 'neon'
  | 'flat'

export const THEME_IDS: ThemeId[] = [
  'modern',
  'glass',
  'neumorphism',
  'retro',
  'material',
  'synthwave',
  'clay',
  'minimal',
  'neon',
  'flat'
]

export const THEME_LABELS: Record<ThemeId, string> = {
  modern: 'Modern Dark UI',
  glass: 'Glassmorphism',
  neumorphism: 'Neumorphism',
  retro: 'Retro Terminal',
  material: 'Material Design',
  synthwave: 'Synthwave',
  clay: 'Claymorphism',
  minimal: 'Minimalism',
  neon: 'Neon',
  flat: 'Flat Design 2.0'
}

export interface AppSettings {
  /** Шаблон оформления из `THEME_IDS`. */
  theme: ThemeId
  sortMode: SortMode
  language: Language
  lastSyncInput: string
  scale: number
  /** Убирает превью в строках — строка становится компактной. */
  compact: boolean
  stageColors: Record<Stage, string>
  /** Цвет фона приложения; пусто — цвет из темы. Меняет только полосу за плашками уровней. */
  backgroundColor: string
  /** Цвет панелей, сайдбара и карточек; пусто — цвет из темы. */
  panelColor: string
  /** Цвет фона самих объектов: плашек уровней, карточек и панелей. */
  objectColor: string
  /** Цвет обычных кнопок; пусто — цвет из темы. */
  buttonColor: string
  textColor: string
  /** Файл фоновой картинки относительно папки данных (например `background/x.gif`). */
  backgroundImage: string
  /** Пусто — шрифт по умолчанию. Иначе имя системного шрифта или `custom:<имя файла>`. */
  fontFamily: string
}

export interface AppData {
  version: number
  settings: AppSettings
  levels: LevelPlan[]
}

export interface LevelDraft {
  name: string
  source: LevelSource
  demonlistId: number | null
  ingameId: number | null
  placement: number | null
  creator: string
  verifier: string
  videoUrl: string
  previewPath: string
  difficulty: string
  popularity: string
  attempts: number | null
  progress: string
  stage: Stage
  comment: string
}

export type DemonlistListType = 'main' | 'extended' | 'advanced' | 'unbounded'

export const DEMONLIST_LIST_LABELS: Record<DemonlistListType, string> = {
  main: 'Main',
  extended: 'Extended',
  advanced: 'Advanced',
  unbounded: 'Unbounded'
}

export interface LevelSearchQuery {
  search?: string
  listType?: DemonlistListType | ''
  limit?: number
  offset?: number
}

export interface SyncChangedLevel {
  name: string
  stage: Stage
  progress: string
}

export interface SyncReport {
  username: string
  profileUrl: string
  userId: number
  placement: number | null
  points: number | null
  added: SyncChangedLevel[]
  updated: SyncChangedLevel[]
  skipped: string[]
  completedTotal: number
  progressTotal: number
  /** Уровни из Global Demonlist, которые игрок ещё не прошёл. */
  uncompletedTotal: number
  /** Сколько из них добавил этот запуск синхронизации. */
  uncompletedFetched: number
  detailsFailed: number
  message: string
}

export interface SyncResult {
  report: SyncReport
  levels: LevelPlan[]
}
