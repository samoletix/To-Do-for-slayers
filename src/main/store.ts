import { app } from 'electron'
import { promises as fs, readFileSync, watch, type FSWatcher } from 'node:fs'
import path from 'node:path'
import { DEFAULT_SCALE, defaultData, normalize } from '../shared/defaults'
import {
  STRINGS_EN_FILE_NAME,
  STRINGS_FILE_NAME,
  buildStringsFile,
  parseStringsFile,
  setStringOverrides,
  t
} from '../shared/strings'
import type { AppData, Language, ThemeId } from '../shared/types'
import { THEME_IDS } from '../shared/types'

const DATA_FILE_NAME = 'to-do-for-slayers.json'
const LOCATION_FILE_NAME = 'location.json'
const PREVIEWS_DIR = 'previews'
const FONTS_DIR = 'fonts'
const BACKGROUNDS_DIR = 'backgrounds'

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'])
const FONT_EXT = new Set(['.ttf', '.otf', '.ttc', '.woff', '.woff2'])

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.ttc': 'font/collection',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

let cache: AppData | null = null
let writeQueue: Promise<unknown> = Promise.resolve()
let locationCache: string | null = null

/** Папка, куда Windows положила данные приложения по умолчанию. */
export function defaultDataDir(): string {
  return app.getPath('userData')
}

function locationFile(): string {
  return path.join(defaultDataDir(), LOCATION_FILE_NAME)
}

/** Текущая папка данных: пользователь мог перенести её в другое место. */
export function dataDir(): string {
  if (locationCache) return locationCache
  const fallback = defaultDataDir()
  try {
    // Синхронно: путь нужен до первого промиса, в том числе loadScale().
    const raw = readFileSync(locationFile(), 'utf8')
    const parsed = JSON.parse(raw) as { dataDir?: unknown }
    const dir = typeof parsed.dataDir === 'string' ? parsed.dataDir.trim() : ''
    locationCache = dir ? path.resolve(dir) : fallback
  } catch {
    locationCache = fallback
  }
  return locationCache
}

export function dataFilePath(): string {
  return path.join(dataDir(), DATA_FILE_NAME)
}

export function previewsDir(): string {
  return path.join(dataDir(), PREVIEWS_DIR)
}

export function fontsDir(): string {
  return path.join(dataDir(), FONTS_DIR)
}

export function backgroundsDir(): string {
  return path.join(dataDir(), BACKGROUNDS_DIR)
}

export function stringsFilePath(language: Language): string {
  return path.join(dataDir(), language === 'en' ? STRINGS_EN_FILE_NAME : STRINGS_FILE_NAME)
}

async function exists(file: string): Promise<boolean> {
  return fs
    .access(file)
    .then(() => true)
    .catch(() => false)
}

/** Создаёт файл надписей при первом запуске и применяет переводы. */
export async function loadStrings(language: Language): Promise<Record<string, string>> {
  const file = stringsFilePath(language)
  await fs.mkdir(path.dirname(file), { recursive: true })
  if (!(await exists(file))) {
    await fs.writeFile(file, buildStringsFile(language), 'utf8').catch(() => undefined)
  }
  let overrides: Record<string, string> = {}
  try {
    overrides = parseStringsFile(await fs.readFile(file, 'utf8'))
  } catch {
    overrides = {}
  }
  setStringOverrides(overrides)
  return overrides
}

/**
 * Следит за файлами надписей в папке данных и сообщает об изменениях.
 * Смотрим за папкой, а не за файлами: редакторы часто пишут через
 * временный файл с последующим переименованием, и следилка за файлом
 * в этом случае молча отваливается. Так же переживает перенос папки,
 * если Watcher пересоздан через restartStringsWatch.
 */
export function watchStrings(onChange: () => void): FSWatcher[] {
  const watchers: FSWatcher[] = []
  const names = new Set<string>([STRINGS_FILE_NAME, STRINGS_EN_FILE_NAME])
  let timer: NodeJS.Timeout | null = null
  try {
    const watcher = watch(dataDir(), (_event, fileName) => {
      if (fileName && !names.has(String(fileName))) return
      // Редакторы пишут файл в несколько заходов — ждём тишины.
      if (timer) clearTimeout(timer)
      timer = setTimeout(onChange, 250)
    })
    watcher.on('error', () => undefined)
    watchers.push(watcher)
  } catch {
    // папки ещё нет — она появится после первого сохранения
  }
  return watchers
}

/** Масштаб из файла данных; 2x по умолчанию. */
export function loadScale(): number {
  const value = cache?.settings.scale
  return typeof value === 'number' && Number.isFinite(value) ? value : DEFAULT_SCALE
}

/** Язык из файла данных — нужен до отрисовки окна. */
export function loadLanguage(): Language {
  return cache?.settings.language === 'en' ? 'en' : 'ru'
}

/** Шаблон оформления из файла данных — нужен до отрисовки окна. */
export function loadTheme(): ThemeId {
  const value = cache?.settings.theme
  return typeof value === 'string' && THEME_IDS.includes(value as ThemeId) ? (value as ThemeId) : 'modern'
}

export async function loadData(): Promise<AppData> {
  if (cache) return cache

  const file = dataFilePath()
  try {
    const raw = await fs.readFile(file, 'utf8')
    cache = normalize(JSON.parse(raw))
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') {
      const backup = `${file}.broken-${Date.now()}`
      await fs.rename(file, backup).catch(() => undefined)
      console.error(`Файл данных повреждён (${(error as Error).message}). Копия: ${backup}`)
    } else {
      const migrated = await migrateOldData(file)
      if (migrated) {
        cache = migrated
        return cache
      }
    }
    cache = defaultData()
    await writeNow(cache).catch(() => undefined)
  }

  return cache
}

/** Переносит данные старой версии (`gd-planner-data.json`) в новый файл. */
async function migrateOldData(target: string): Promise<AppData | null> {
  const candidates = [
    path.join(path.dirname(target), 'gd-planner-data.json'),
    path.join(defaultDataDir(), 'gd-planner-data.json'),
    path.join(app.getPath('appData'), 'gd-planner', 'gd-planner-data.json'),
    path.join(app.getPath('appData'), 'gd-planner', 'gd-planner.json')
  ]

  for (const source of candidates) {
    try {
      const raw = await fs.readFile(source, 'utf8')
      const data = normalize(JSON.parse(raw))
      const tmp = `${target}.tmp`
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
      await fs.rename(tmp, target)
      console.log(`Данные перенесены из ${source} в ${target}`)
      return data
    } catch {
      // пробуем следующий вариант
    }
  }

  return null
}

export async function saveData(data: unknown): Promise<AppData> {
  cache = normalize(data)
  const snapshot = cache
  writeQueue = writeQueue
    .then(() => writeNow(snapshot))
    .catch((error) => {
      console.error('Не удалось сохранить файл данных:', error)
    })
  await writeQueue
  return snapshot
}

async function writeNow(data: AppData): Promise<void> {
  const file = dataFilePath()
  const tmp = `${file}.tmp`
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, file)
}

export async function importData(raw: string): Promise<AppData> {
  const parsed = normalize(JSON.parse(raw))
  return saveData(parsed)
}

/**
 * Переносит всю папку данных в новое место: файл данных, оба файла надписей,
 * превью и шрифты. Старая папка не удаляется.
 */
export async function moveDataDir(target: string): Promise<string> {
  const from = dataDir()
  const to = path.resolve(target)
  if (to === from) return from

  // Сначала фиксируем текущее состояние на диске, иначе в новую папку уедет старый файл.
  await writeNow(cache ?? defaultData())

  await fs.mkdir(to, { recursive: true })
  for (const name of [DATA_FILE_NAME, STRINGS_FILE_NAME, STRINGS_EN_FILE_NAME]) {
    const source = path.join(from, name)
    if (await exists(source)) await fs.copyFile(source, path.join(to, name))
  }
  for (const dir of [PREVIEWS_DIR, FONTS_DIR, BACKGROUNDS_DIR]) {
    const source = path.join(from, dir)
    if (await exists(source)) {
      await fs.cp(source, path.join(to, dir), { recursive: true })
    }
  }

  await fs.mkdir(defaultDataDir(), { recursive: true })
  await fs.writeFile(locationFile(), JSON.stringify({ dataDir: to }, null, 2), 'utf8')
  locationCache = to

  // Кэш перечитываем из нового места.
  cache = null
  return to
}

async function copyInto(source: string, folder: string): Promise<string> {
  const ext = path.extname(source).toLowerCase()
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`
  const dir = path.join(dataDir(), folder)
  await fs.mkdir(dir, { recursive: true })
  await fs.copyFile(source, path.join(dir, name))
  return `${folder}/${name}`
}

/** Копирует картинку в папку превью и возвращает путь относительно папки данных. */
export function savePreview(source: string): Promise<string> {
  if (!IMAGE_EXT.has(path.extname(source).toLowerCase())) throw new Error(t('Это не картинка'))
  return copyInto(source, PREVIEWS_DIR)
}

/** Копирует файл шрифта в папку шрифтов и возвращает путь относительно папки данных. */
export function saveFont(source: string): Promise<string> {
  if (!FONT_EXT.has(path.extname(source).toLowerCase())) throw new Error(t('Это не картинка'))
  return copyInto(source, FONTS_DIR)
}

/** Копирует фоновую картинку в папку backgrounds и возвращает путь относительно папки данных. */
export function saveBackground(source: string): Promise<string> {
  if (!IMAGE_EXT.has(path.extname(source).toLowerCase())) throw new Error(t('Это не картинка'))
  return copyInto(source, BACKGROUNDS_DIR)
}

/**
 * Картинка из буфера обмена в виде PNG.
 *
 * Electron читает буфер обмена асинхронно: `clipboard.read()` отдаёт список
 * ClipboardItem, из которого нужен первый blob с mime, начинающимся на `image/`.
 */
async function clipboardImagePng(): Promise<Buffer> {
  const { clipboard } = await import('electron')
  const items = await clipboard.read()
  for (const item of items) {
    const mime = item.types.find((type) => type.startsWith('image/'))
    if (!mime) continue
    const payload = await item.getType(mime)
    if (!(payload instanceof Blob)) continue
    const buffer = Buffer.from(await payload.arrayBuffer())
    if (buffer.length) return buffer
  }
  throw new Error(t('В буфере обмена нет картинки'))
}

/** Картинка из буфера обмена сохраняется в папку превью и лежит рядом с остальными. */
export async function saveClipboardImage(): Promise<string> {
  const buffer = await clipboardImagePng()
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.png`
  const dir = previewsDir()
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, name), buffer)
  return `${PREVIEWS_DIR}/${name}`
}

/** Картинка из буфера обмена как data: URL — показываем превью до сохранения. */
export async function readClipboardImage(): Promise<string> {
  const buffer = await clipboardImagePng()
  return `data:image/png;base64,${buffer.toString('base64')}`
}

/** Картинка или шрифт как data: URL — CSP рендерера не пускает внешние файлы. */
export async function readAsset(relative: string): Promise<string> {
  const full = path.resolve(dataDir(), relative)
  if (!full.startsWith(path.resolve(dataDir()))) throw new Error(t('Не удалось прочитать изображение'))
  const ext = path.extname(full).toLowerCase()
  const mime = MIME[ext]
  if (!mime) throw new Error(t('Это не изображение'))
  const buffer = await fs.readFile(full)
  return `data:${mime};base64,${buffer.toString('base64')}`
}

export { t }
