import { app, BrowserWindow, dialog, ipcMain, screen, shell } from 'electron'
import { promises as fs, readdirSync, type FSWatcher } from 'node:fs'
import path from 'node:path'
import { COMMON_FONTS, SCALE_OPTIONS } from '../shared/defaults'
import { buildStringsFile, t } from '../shared/strings'
import type { Language, LevelPlan, LevelSearchQuery } from '../shared/types'
import { getLevel, listLevels } from './gdapi'
import { syncUser, type SyncUserOptions } from './gdsync'
import {
  dataDir,
  dataFilePath,
  importData,
  loadData,
  loadLanguage,
  loadStrings,
  moveDataDir,
  readAsset,
  readClipboardImage,
  saveBackground,
  saveClipboardImage,
  saveData,
  saveFont,
  savePreview,
  stringsFilePath,
  watchStrings
} from './store'

function assertSafeUrl(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(t('Некорректная ссылка: {url}', { url }))
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(t('Разрешены только http(s)-ссылки'))
  }
  return parsed.toString()
}

function asLanguage(value: unknown): Language {
  return value === 'en' ? 'en' : 'ru'
}

let stringsWatchers: FSWatcher[] = []
let resolveWindow: () => BrowserWindow | null = () => null

/** Пересоздаёт следилку за файлами надписей (после переноса папки данных). */
export function restartStringsWatch(): void {
  for (const watcher of stringsWatchers) {
    try {
      watcher.close()
    } catch {
      // уже закрыта
    }
  }
  stringsWatchers = watchStrings(() => {
    const language = loadLanguage()
    void loadStrings(language).then((overrides) => {
      resolveWindow()?.webContents.send('strings:changed', { overrides, language })
    })
  })
}

const imageCache = new Map<string, string>()

const STYLE_SUFFIX = /[-_,]?(regular|bold|italic|bolditalic|oblique|light|semilight|thin|black|heavy|medium|semibold|extrabold|ultra|condensed|expanded)$/i

/** Папка системных шрифтов Windows. */
function fontsFolder(): string {
  return path.join(process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows', 'Fonts')
}

/** Имена системных шрифтов Windows по файлам в папке Fonts. */
function systemFonts(): string[] {
  const names = new Set<string>(COMMON_FONTS)
  let files: string[] = []
  try {
    files = readdirSync(fontsFolder())
  } catch {
    files = []
  }
  for (const file of files) {
    if (!/\.(ttf|otf|ttc)$/i.test(file)) continue
    let base = file.replace(/\.(ttf|otf|ttc)$/i, '')
    let previous = ''
    while (base !== previous) {
      previous = base
      base = base.replace(STYLE_SUFFIX, '')
    }
    const name = base.replace(/[-_]+/g, ' ').trim()
    if (name.length >= 2) names.add(name)
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'en'))
}

export function registerIpc(getWindow: () => BrowserWindow | null): void {
  resolveWindow = getWindow
  ipcMain.handle('data:load', () => loadData())
  ipcMain.handle('data:save', (_event, data: unknown) => saveData(data))

  ipcMain.handle('api:searchLevels', (_event, query: LevelSearchQuery) =>
    listLevels({
      search: typeof query?.search === 'string' ? query.search : undefined,
      listType: query?.listType ?? '',
      limit: Math.min(100, Math.max(1, Number(query?.limit) || 40)),
      offset: Math.max(0, Number(query?.offset) || 0)
    })
  )

  ipcMain.handle('api:getLevel', async (_event, id: unknown) => {
    const levelId = Number(id)
    if (!Number.isInteger(levelId) || levelId < 1) throw new Error(t('Некорректный ID уровня'))
    return getLevel(levelId)
  })

  ipcMain.handle('api:syncUser', (_event, options: SyncUserOptions & { existing: LevelPlan[] }) =>
    syncUser({
      input: String(options?.input ?? ''),
      existing: Array.isArray(options?.existing) ? options.existing : [],
      addNew: options?.addNew !== false,
      fetchDetails: options?.fetchDetails !== false,
      addUncompleted: options?.addUncompleted !== false
    })
  )

  ipcMain.handle('app:openExternal', async (_event, url: unknown) => {
    await shell.openExternal(assertSafeUrl(String(url)))
    return true
  })

  ipcMain.handle('media:fetchImage', async (_event, url: unknown) => {
    const safe = assertSafeUrl(String(url))
    if (!safe.startsWith('https://i.ytimg.com/')) {
      throw new Error(t('Загрузка картинок разрешена только с i.ytimg.com'))
    }
    const cached = imageCache.get(safe)
    if (cached) return cached
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    try {
      const response = await fetch(safe, { signal: controller.signal })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      const mime = response.headers.get('content-type') || 'image/jpeg'
      if (!mime.startsWith('image/')) throw new Error(t('Это не изображение'))
      const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
      if (imageCache.size > 200) imageCache.clear()
      imageCache.set(safe, dataUrl)
      return dataUrl
    } finally {
      clearTimeout(timer)
    }
  })

  ipcMain.handle('file:export', async (_event, defaultName: unknown) => {
    const window = getWindow()
    const result = await dialog.showSaveDialog(window ?? ({} as BrowserWindow), {
      title: t('Экспорт копии'),
      defaultPath: path.join(
        app.getPath('documents'),
        typeof defaultName === 'string' && defaultName ? defaultName : 'to-do-for-slayers.json'
      ),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return null
    const data = await loadData()
    await fs.writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf8')
    return result.filePath
  })

  ipcMain.handle('file:import', async () => {
    const window = getWindow()
    const result = await dialog.showOpenDialog(window ?? ({} as BrowserWindow), {
      title: t('Импорт из файла'),
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const raw = await fs.readFile(result.filePaths[0], 'utf8')
    const data = await importData(raw)
    return { path: result.filePaths[0], data }
  })

  ipcMain.handle('file:reveal', async () => {
    const file = dataFilePath()
    await fs.mkdir(path.dirname(file), { recursive: true })
    shell.showItemInFolder(file)
    return file
  })

  ipcMain.handle('file:path', () => dataFilePath())
  ipcMain.handle('file:dir', () => dataDir())

  ipcMain.handle('file:revealDir', async () => {
    await fs.mkdir(dataDir(), { recursive: true })
    await shell.openPath(dataDir())
    return dataDir()
  })

  ipcMain.handle('file:moveDir', async () => {
    const window = getWindow()
    const result = await dialog.showOpenDialog(window ?? ({} as BrowserWindow), {
      title: t('Переместить данные…'),
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: dataDir()
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const dir = await moveDataDir(result.filePaths[0])
    imageCache.clear()
    restartStringsWatch()
    return dir
  })

  ipcMain.handle('file:pickImage', async () => {
    const window = getWindow()
    const result = await dialog.showOpenDialog(window ?? ({} as BrowserWindow), {
      title: t('Выбрать изображение'),
      properties: ['openFile'],
      filters: [{ name: t('Своё превью'), extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return savePreview(result.filePaths[0])
  })

  ipcMain.handle('file:pickBackground', async () => {
    const window = getWindow()
    const result = await dialog.showOpenDialog(window ?? ({} as BrowserWindow), {
      title: t('Фоновая картинка'),
      properties: ['openFile'],
      filters: [{ name: t('Фоновая картинка'), extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return saveBackground(result.filePaths[0])
  })

  ipcMain.handle('file:previewFromClipboard', async () => saveClipboardImage())

  ipcMain.handle('file:clipboardImage', async () => readClipboardImage())

  ipcMain.handle('file:pickFont', async () => {
    const window = getWindow()
    const result = await dialog.showOpenDialog(window ?? ({} as BrowserWindow), {
      title: t('Выбрать файл шрифта'),
      properties: ['openFile'],
      filters: [{ name: t('Свой шрифт'), extensions: ['ttf', 'otf', 'ttc', 'woff', 'woff2'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return saveFont(result.filePaths[0])
  })

  ipcMain.handle('asset:read', (_event, relative: unknown) => readAsset(String(relative ?? '')))

  ipcMain.handle('fonts:list', () => systemFonts())

  ipcMain.handle('strings:path', (_event, language: unknown) => stringsFilePath(asLanguage(language)))

  ipcMain.handle('strings:load', (_event, language: unknown) => loadStrings(asLanguage(language)))

  ipcMain.handle('strings:reload', async (_event, language: unknown) => {
    const overrides = await loadStrings(asLanguage(language))
    getWindow()?.webContents.send('strings:changed', { overrides, language: asLanguage(language) })
    return overrides
  })

restartStringsWatch()

  ipcMain.handle('strings:reveal', async (_event, language: unknown) => {
    const lang = asLanguage(language)
    const file = stringsFilePath(lang)
    await fs.mkdir(path.dirname(file), { recursive: true })
    const exists = await fs.access(file).then(
      () => true,
      () => false
    )
    if (!exists) {
      await fs.writeFile(file, buildStringsFile(lang), 'utf8')
    }
    shell.showItemInFolder(file)
    return file
  })

  ipcMain.handle('app:setZoom', (_event, scale: unknown) => {
    const value = Number(scale)
    if (!Number.isFinite(value)) return false
    const maxScale = SCALE_OPTIONS[SCALE_OPTIONS.length - 1]
    const factor = Math.min(maxScale, Math.max(0.5, value))
    const window = getWindow()
    if (!window) return false
    window.webContents.setZoomFactor(factor)

    // Держим видимую область в CSS-пикселях, чтобы интерфейс не сжимался.
    const area = screen.getPrimaryDisplay().workAreaSize
    const width = Math.min(area.width - 60, Math.round(1180 * factor))
    const height = Math.min(area.height - 60, Math.round(760 * factor))
    const bounds = window.getBounds()
    if (Math.abs(bounds.width - width) > 8 || Math.abs(bounds.height - height) > 8) {
      window.setSize(width, height)
    }
    return true
  })
}
