import { app, BrowserWindow, screen, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { themeFallback } from '../shared/themes'
import { setLanguage, t } from '../shared/strings'
import { registerIpc } from './ipc'
import { defaultDataDir, loadData, loadLanguage, loadScale, loadStrings, loadTheme } from './store'

let mainWindow: BrowserWindow | null = null

/** Окно рассчитывается от масштаба: CSS-пиксели = физические / scale. */
function windowSize(scale: number): { width: number; height: number } {
  const area = screen.getPrimaryDisplay().workAreaSize
  const width = Math.min(area.width - 60, Math.round(1180 * scale))
  const height = Math.min(area.height - 60, Math.round(760 * scale))
  return { width, height }
}

/**
 * Иконка окна.
 *
 * Сначала смотрим папку данных — пользователь может положить туда свой
 * `icon.ico`, и он подхватится без пересборки. Если файла нет, берём
 * иконку из сборки: у exe значок свой, у окна — этот файл.
 */
function appIcon(): string | undefined {
  const candidates = [
    path.join(app.getPath('appData'), 'to-do-for-slayers', 'icon.ico'),
    path.join(defaultDataDir(), 'icon.ico'),
    path.join(app.getAppPath(), 'build', 'icon.ico')
  ]
  for (const icon of candidates) {
    try {
      if (fs.existsSync(icon)) return icon
    } catch {
      // папки может не быть — пробуем следующий вариант
    }
  }
  return undefined
}

/** Иконка могла появиться в папке данных уже после запуска — перечитываем при фокусе. */
function refreshIcon(window: BrowserWindow): void {
  const icon = appIcon()
  if (!icon) return
  try {
    window.setIcon(icon)
  } catch {
    // на некоторых системах setIcon недоступен — не страшно
  }
}

function createWindow(): void {
  const scale = loadScale()
  const size = windowSize(scale)
  // Фон окна берём из шаблона, иначе до отрисовки мигает белым/чёрным.
  const fallback = themeFallback(loadTheme())

  mainWindow = new BrowserWindow({
    title: t('To-Do for slayers'),
    width: size.width,
    height: size.height,
    minWidth: Math.round(760 * scale),
    minHeight: Math.round(480 * scale),
    backgroundColor: fallback.background,
    icon: appIcon(),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.webContents.setZoomFactor(scale)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (mainWindow) {
    mainWindow.on('focus', () => refreshIcon(mainWindow as BrowserWindow))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env.ELECTRON_RENDERER_URL
    if (devUrl && url.startsWith(devUrl)) return
    event.preventDefault()
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
  })

  const devUrl = process.env.ELECTRON_RENDERER_URL
  if (devUrl) {
    mainWindow.loadURL(devUrl)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    app.setAppUserModelId('com.todoforslayers.app')
    // Язык известен только после чтения файла данных — надписи нужны для заголовка окна.
    await loadData()
    const language = loadLanguage()
    setLanguage(language)
    await loadStrings(language)
    registerIpc(() => mainWindow)
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
