import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEFAULT_STAGE_COLORS } from '@shared/defaults'
import { setLanguage, setStringOverrides, t } from '@shared/strings'
import { themeVars } from '@shared/themes'
import type {
  AppData,
  AppSettings,
  Language,
  LevelDraft,
  LevelPlan,
  Stage,
  SyncReport
} from '@shared/types'
import AddLevelModal from './components/AddLevelModal'
import LevelEditorModal from './components/LevelEditorModal'
import LevelRow from './components/LevelRow'
import SettingsModal from './components/SettingsModal'
import Sidebar from './components/Sidebar'
import SyncModal from './components/SyncModal'
import {
  errorMessage,
  freezeVisibleOrder,
  matchesQuery,
  moveLevelToNumber,
  nowISO,
  sortLevels,
  setLocale,
  uid
} from './lib'

type ModalState =
  | { type: 'add' }
  | { type: 'edit'; id: string }
  | { type: 'sync' }
  | { type: 'settings' }
  | null

const FONT_FACE_ID = 'custom-app-font'
const THEME_STYLE_ID = 'app-theme-style'

export default function App(): ReactNode {
  const [data, setData] = useState<AppData | null>(null)
  const [query, setQuery] = useState('')
  const [activeStages, setActiveStages] = useState<Stage[]>([])
  const [modal, setModal] = useState<ModalState>(null)
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null)
  const [stringsPath, setStringsPath] = useState('')
  const [dataPath, setDataPath] = useState('')
  const [dataDirPath, setDataDirPath] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; side: 'before' | 'after' } | null>(null)
  // Растёт при перечитывании strings.txt — это заставляет React перерисовать надписи.
  const [stringsVersion, setStringsVersion] = useState(0)
  const toastTimer = useRef<number | null>(null)

  const notify = useCallback((text: string, error = false): void => {
    setToast({ text, error })
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 4200)
  }, [])

  const applyStrings = useCallback((overrides: Record<string, string>): void => {
    setStringOverrides(overrides)
    setStringsVersion((value) => value + 1)
  }, [])

  const refreshPaths = useCallback(async (language: Language): Promise<void> => {
    try {
      const [strings, file, dir] = await Promise.all([
        window.api.stringsFilePath(language),
        window.api.dataFilePath(),
        window.api.dataDir()
      ])
      setStringsPath(strings)
      setDataPath(file)
      setDataDirPath(dir)
    } catch {
      // пути — справочная информация, их отсутствие не ломает приложение
    }
  }, [])

  const applyLoaded = useCallback(
    (loaded: AppData): void => {
      setData(loaded)
      void window.api.setZoom(loaded.settings.scale)
      setLanguage(loaded.settings.language)
      setLocale(loaded.settings.language)
      document.documentElement.lang = loaded.settings.language
    },
    []
  )

  useEffect(() => {
    void window.api
      .loadData()
      .then(async (loaded) => {
        applyLoaded(loaded)
        await refreshPaths(loaded.settings.language)
        const overrides = await window.api.loadStrings(loaded.settings.language)
        applyStrings(overrides)
      })
      .catch((error) => notify(errorMessage(error), true))
  }, [notify, applyStrings, refreshPaths, applyLoaded])

  const commit = useCallback(
    (next: AppData): void => {
      setData(next)
      void window.api.saveData(next).catch((error) => notify(errorMessage(error), true))
    },
    [notify]
  )

  const levels = useMemo(() => data?.levels ?? [], [data])
  const settings = data?.settings ?? null

  const visible = useMemo(() => {
    const filtered = levels.filter((level) => {
      if (activeStages.length && !activeStages.includes(level.stage)) return false
      return matchesQuery(level, query)
    })
    return sortLevels(filtered, settings?.sortMode ?? 'gdl')
  }, [levels, activeStages, query, settings?.sortMode])

  const activeModalLevel: LevelPlan | null = useMemo(() => {
    if (modal?.type !== 'edit') return null
    return levels.find((level) => level.id === modal.id) ?? null
  }, [modal, levels])

  const requireData = (): AppData | null => {
    if (!data) {
      notify(t('Данные ещё загружаются'), true)
      return null
    }
    return data
  }

  const updateSettings = (patch: Partial<AppSettings>): void => {
    const current = requireData()
    if (!current) return
    commit({ ...current, settings: { ...current.settings, ...patch } })
  }

  const changeLanguage = async (language: Language): Promise<void> => {
    updateSettings({ language })
    setLanguage(language)
    setLocale(language)
    document.documentElement.lang = language
    try {
      applyStrings(await window.api.loadStrings(language))
      await refreshPaths(language)
    } catch (error) {
      notify(errorMessage(error), true)
    }
  }

  const changeStageColor = (stage: Stage, color: string): void => {
    const current = requireData()
    if (!current) return
    commit({
      ...current,
      settings: {
        ...current.settings,
        stageColors: { ...current.settings.stageColors, [stage]: color }
      }
    })
  }

  const resetColors = (): void => {
    if (!window.confirm(t('Сбросить все цвета на цвета шаблона?'))) return
    updateSettings({
      stageColors: { ...DEFAULT_STAGE_COLORS },
      backgroundColor: '',
      panelColor: '',
      objectColor: '',
      buttonColor: '',
      textColor: ''
    })
  }

  const createLevel = (draft: LevelDraft): void => {
    const current = requireData()
    if (!current) return
    const stamp = nowISO()
    const level: LevelPlan = {
      id: uid(),
      name: draft.name,
      source: draft.source,
      demonlistId: draft.demonlistId,
      ingameId: draft.ingameId,
      placement: draft.placement,
      creator: draft.creator,
      verifier: draft.verifier,
      videoUrl: draft.videoUrl,
      previewPath: draft.previewPath,
      difficulty: draft.difficulty,
      popularity: draft.popularity,
      attempts: draft.attempts,
      progress: draft.progress,
      stage: draft.stage,
      comment: draft.comment,
      order: current.levels.length,
      createdAt: stamp,
      updatedAt: stamp
    }
    commit({ ...current, levels: [...current.levels, level] })
    notify(t('«{name}» добавлен в планы', { name: level.name }))
  }

  const saveLevel = (levelId: string, draft: LevelDraft): void => {
    const current = requireData()
    if (!current) return
    commit({
      ...current,
      levels: current.levels.map((level) =>
        level.id === levelId
          ? {
              ...level,
              name: draft.name,
              ingameId: draft.ingameId,
              placement: draft.placement,
              creator: draft.creator,
              verifier: draft.verifier,
              videoUrl: draft.videoUrl,
              previewPath: draft.previewPath,
              difficulty: draft.difficulty,
              popularity: draft.popularity,
              attempts: draft.attempts,
              progress: draft.progress,
              stage: draft.stage,
              comment: draft.comment,
              updatedAt: nowISO()
            }
          : level
      )
    })
    setModal(null)
    notify(t('Сохранено'))
  }

  const deleteLevel = (level: LevelPlan): void => {
    const current = requireData()
    if (!current) return
    if (!window.confirm(t('Удалить «{name}»?', { name: level.name }))) return
    commit({ ...current, levels: current.levels.filter((item) => item.id !== level.id) })
    setModal(null)
    notify(t('«{name}» удалён', { name: level.name }))
  }

  const changeStage = (level: LevelPlan, next: Stage): void => {
    const current = requireData()
    if (!current) return
    commit({
      ...current,
      levels: current.levels.map((item) =>
        item.id === level.id
          ? {
              ...item,
              stage: next,
              progress: next === 'completed' ? '100%' : item.progress,
              updatedAt: nowISO()
            }
          : item
      )
    })
  }

  const applySync = (syncedLevels: LevelPlan[], report: SyncReport, input: string): void => {
    const current = requireData()
    if (!current) return
    commit({
      ...current,
      settings: { ...current.settings, lastSyncInput: input },
      levels: syncedLevels
    })
    notify(t('Синхронизация с {user}: {message}', { user: report.username, message: report.message }))
  }

  const changeScale = (scale: number): void => {
    const current = requireData()
    if (!current) return
    void window.api.setZoom(scale).catch((error) => notify(errorMessage(error), true))
    commit({ ...current, settings: { ...current.settings, scale } })
  }

  const restoreGdlOrder = (): void => {
    const current = requireData()
    if (!current) return
    commit({ ...current, settings: { ...current.settings, sortMode: 'gdl' } })
    notify(t('Порядок по позиции в GDL восстановлен'))
  }

  const toggleStageFilter = (stage: Stage): void => {
    setActiveStages((prev) =>
      prev.includes(stage) ? prev.filter((item) => item !== stage) : [...prev, stage]
    )
  }

  /** Ввод номера строки: ставит уровень на выбранное место и включает ручной порядок. */
  const moveToNumber = (level: LevelPlan, number: number): void => {
    const current = requireData()
    if (!current) return
    const ids = visible.map((item) => item.id)
    if (!ids.includes(level.id)) return
    const frozen = freezeVisibleOrder(current.levels, ids)
    const next = moveLevelToNumber(frozen, ids, level.id, number)
    const same = next.every((item, index) => item.id === current.levels[index]?.id)
    if (same) return
    commit({ ...current, settings: { ...current.settings, sortMode: 'manual' }, levels: next })
  }

  const finishDrag = (target: LevelPlan): void => {
    const current = requireData()
    const dragged = draggingId
    const side = dropTarget?.id === target.id ? dropTarget.side : 'after'
    setDraggingId(null)
    setDropTarget(null)
    if (!current || !dragged || dragged === target.id) return

    const ids = visible.map((level) => level.id)
    const from = ids.indexOf(dragged)
    if (from === -1) return
    let to = ids.indexOf(target.id)
    if (to === -1) return
    if (side === 'after') to += 1
    // После удаления перетаскиваемой строки целевой индекс сдвигается на один.
    if (from < to) to -= 1
    if (to === from) return

    commit({
      ...current,
      settings: { ...current.settings, sortMode: 'manual' },
      levels: moveLevelToNumber(freezeVisibleOrder(current.levels, ids), ids, dragged, to + 1)
    })
  }

  const exportData = async (): Promise<void> => {
    try {
      const file = await window.api.exportData('to-do-for-slayers.json')
      if (file) notify(t('Копия сохранена: {path}', { path: file }))
    } catch (error) {
      notify(errorMessage(error), true)
    }
  }

  const importData = async (): Promise<void> => {
    try {
      const result = await window.api.importData()
      if (!result) return
      applyLoaded(result.data)
      applyStrings(await window.api.loadStrings(result.data.settings.language))
      await refreshPaths(result.data.settings.language)
      setModal(null)
      notify(t('Загружено из {path}', { path: result.path }))
    } catch (error) {
      notify(errorMessage(error), true)
    }
  }

  const moveDataDir = async (): Promise<void> => {
    try {
      const dir = await window.api.moveDataDir()
      if (!dir) return
      const reloaded = await window.api.loadData()
      applyLoaded(reloaded)
      applyStrings(await window.api.loadStrings(reloaded.settings.language))
      await refreshPaths(reloaded.settings.language)
      notify(t('Данные перемещены в {path}', { path: dir }))
    } catch (error) {
      notify(errorMessage(error), true)
    }
  }

  const pickFont = async (): Promise<void> => {
    try {
      const picked = await window.api.pickFont()
      if (picked) updateSettings({ fontFamily: `custom:${picked}` })
    } catch (error) {
      notify(errorMessage(error), true)
    }
  }

  const pickBackground = async (): Promise<void> => {
    try {
      const picked = await window.api.pickBackground()
      if (picked) updateSettings({ backgroundImage: picked })
    } catch (error) {
      notify(errorMessage(error), true)
    }
  }

  const openUrl = (url: string): void => {
    if (!url) return
    void window.api.openExternal(url).catch((error) => notify(errorMessage(error), true))
  }

  const revealStrings = async (): Promise<void> => {
    try {
      const language = settings?.language ?? 'ru'
      setStringsPath(await window.api.revealStringsFile(language))
    } catch (error) {
      notify(errorMessage(error), true)
    }
  }

  const reloadStrings = async (): Promise<void> => {
    try {
      applyStrings(await window.api.reloadStrings(settings?.language ?? 'ru'))
      notify(t('Надписи обновлены'))
    } catch (error) {
      notify(errorMessage(error), true)
    }
  }

  // Шаблон оформления целиком задаёт CSS-переменные; настройки перекрывают отдельные цвета.
  useEffect(() => {
    const root = document.documentElement
    if (!settings) return
    const vars = themeVars(settings.theme)
    root.dataset.theme = settings.theme
    root.style.setProperty('--bg', vars.bg)
    // Цвет фона из настроений красит только полосу позади плашек уровней.
    root.style.setProperty('--rows-bg', settings.backgroundColor || vars.bg)
    root.style.setProperty('--panel', settings.panelColor || vars.panel)
    root.style.setProperty('--panel-2', settings.panelColor || vars.panel2)
    root.style.setProperty('--object', settings.objectColor || vars.panel)
    root.style.setProperty('--btn', settings.buttonColor || vars.accent)
    root.style.setProperty('--btn-on', vars.onAccent)
    root.style.setProperty('--text', settings.textColor || vars.text)
    root.style.setProperty('--border', vars.border)
    root.style.setProperty('--muted', vars.muted)
    root.style.setProperty('--input', vars.input)
    root.style.setProperty('--shadow', vars.shadow)
    root.style.setProperty('--radius', vars.radius)
    root.style.setProperty('--border-width', vars.borderWidth)
    root.style.setProperty('--blur', vars.blur)
    root.style.setProperty('--line-height', vars.lineHeight)

    const style = document.getElementById(THEME_STYLE_ID)
    if (vars.extraCss) {
      const node = style ?? document.createElement('style')
      node.id = THEME_STYLE_ID
      node.textContent = vars.extraCss
      if (!style) document.head.appendChild(node)
    } else if (style) {
      style.remove()
    }
  }, [settings])

  // Фоновая картинка: грузим один раз и держим в data-URL, чтобы не светить путь в CSS.
  useEffect(() => {
    const root = document.documentElement
    const relative = settings?.backgroundImage ?? ''
    if (!relative) {
      root.style.removeProperty('--bg-image')
      root.classList.remove('has-bg-image')
      return
    }
    let alive = true
    void window.api
      .readAsset(relative)
      .then((dataUrl) => {
        if (!alive) return
        root.style.setProperty('--bg-image', `url("${dataUrl}")`)
        root.classList.add('has-bg-image')
      })
      .catch(() => {
        if (alive) root.style.removeProperty('--bg-image')
      })
    return () => {
      alive = false
    }
  }, [settings?.backgroundImage])

  // Цвета и шрифт из настроек — обычные CSS-переменные на :root.
  useEffect(() => {
    const root = document.documentElement
    if (!settings) return

    const family = settings.fontFamily
    document.getElementById(FONT_FACE_ID)?.remove()
    if (!family) {
      root.style.removeProperty('--font')
      return
    }
    if (family.startsWith('custom:')) {
      const relative = family.slice('custom:'.length)
      void window.api.readAsset(relative).then((dataUrl) => {
        const style = document.createElement('style')
        style.id = FONT_FACE_ID
        style.textContent = `@font-face { font-family: 'AppCustom'; src: url(${dataUrl}); }`
        document.head.appendChild(style)
        root.style.setProperty('--font', `'AppCustom', var(--font-base)`)
      })
      return
    }
    root.style.setProperty('--font', `'${family}', var(--font-base)`)
  }, [settings?.fontFamily])

  useEffect(() => {
    document.title = t('To-Do for slayers')
  }, [stringsVersion])

  // Правки strings.txt подхватываются на лету, без перезапуска.
  useEffect(
    () =>
      window.api.onStringsChanged(({ overrides }) => {
        applyStrings(overrides)
      }),
    [applyStrings]
  )

  const compact = settings?.compact ?? false
  const existingDemonlistIds = useMemo(
    () =>
      levels
        .map((level) => level.demonlistId)
        .filter((id): id is number => typeof id === 'number'),
    [levels]
  )

  return (
    <div className={`app${compact ? ' app--compact' : ''}`}>
      <header className="topbar">
        <h1 className="logo">{t('To-Do for slayers')}</h1>

        <input
          className="search"
          value={query}
          placeholder={t('Поиск')}
          onChange={(event) => setQuery(event.target.value)}
        />

        <button className="btn" onClick={() => setModal({ type: 'sync' })} title="Global Demonlist">
          {t('Синхронизировать')}
        </button>
        <button className="btn btn--primary" onClick={() => setModal({ type: 'add' })}>
          {t('+ Уровень')}
        </button>
      </header>

      <div className="body">
        <Sidebar
          levels={levels}
          activeStages={activeStages}
          settings={settings}
          onToggleStage={toggleStageFilter}
          onResetStages={() => setActiveStages([])}
          onOpenSettings={() => setModal({ type: 'settings' })}
        />

        <main className="main">
          <div className="main__head">
            <span className="muted">
              {visible.length !== levels.length
                ? t('Показано {shown} из {total} уровней', {
                    shown: visible.length,
                    total: levels.length
                  })
                : t('Всего уровней: {n}', { n: visible.length })}
            </span>
            <span className="spacer" />
            {(settings?.sortMode ?? 'gdl') === 'manual' ? (
              <span className="badge" title={t('Порядок задан вручную, а не по позиции в GDL')}>
                {t('Порядок вручную')}
              </span>
            ) : null}
            <button
              className="btn btn--sm"
              onClick={restoreGdlOrder}
              disabled={(settings?.sortMode ?? 'gdl') === 'gdl'}
            >
              {t('Сортировать по позиции в GDL')}
            </button>
          </div>

          {!data ? (
            <div className="empty">
              <span className="spinner" />
            </div>
          ) : null}

          {data && visible.length === 0 ? (
            <div className="empty">
              <p>{levels.length ? t('Ничего не найдено') : t('Список пуст')}</p>
              <button className="btn btn--primary" onClick={() => setModal({ type: 'add' })}>
                {t('+ Уровень')}
              </button>
            </div>
          ) : null}

          {data && visible.length > 0 ? (
            <div className="rows">
              <div className="row row--head">
                <span aria-hidden="true" />
                <span className="row__place">{t('Место')}</span>
                <span className="row__preview" aria-hidden="true" />
                <span className="row__name">{t('Название')}</span>
                <span className="row__stage">{t('Статус')}</span>
                <span className="row__progress">{t('Прогресс')}</span>
                <span className="row__attempts">{t('Попытки')}</span>
                <span className="row__actions" />
              </div>
              {visible.map((level, index) => (
                <LevelRow
                  key={level.id}
                  level={level}
                  settings={settings}
                  position={index + 1}
                  onMoveTo={moveToNumber}
                  draggable
                  isDragging={draggingId === level.id}
                  dropSide={
                    dropTarget && dropTarget.id === level.id && dropTarget.id !== draggingId
                      ? dropTarget.side
                      : null
                  }
                  onDragStart={(item) => setDraggingId(item.id)}
                  onDragEnter={(item, event) => {
                    if (!draggingId || draggingId === item.id) return
                    const bounds = event.currentTarget.getBoundingClientRect()
                    const side = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
                    setDropTarget({ id: item.id, side })
                  }}
                  onDragEnd={() => {
                    setDraggingId(null)
                    setDropTarget(null)
                  }}
                  onDrop={(item) => finishDrag(item)}
                  onEdit={(item) => setModal({ type: 'edit', id: item.id })}
                  onDelete={deleteLevel}
                  onStageChange={changeStage}
                  onOpenUrl={openUrl}
                />
              ))}
            </div>
          ) : null}
        </main>
      </div>

      {modal?.type === 'add' ? (
        <AddLevelModal
          existingDemonlistIds={existingDemonlistIds}
          onCreate={createLevel}
          onClose={() => setModal(null)}
        />
      ) : null}

      {modal?.type === 'edit' && activeModalLevel ? (
        <LevelEditorModal
          level={activeModalLevel}
          onSave={(draft) => saveLevel(activeModalLevel.id, draft)}
          onDelete={deleteLevel}
          onClose={() => setModal(null)}
        />
      ) : null}

      {modal?.type === 'sync' && data ? (
        <SyncModal
          levels={levels}
          initialInput={data.settings.lastSyncInput}
          onApply={applySync}
          onClose={() => setModal(null)}
        />
      ) : null}

      {modal?.type === 'settings' && data ? (
        <SettingsModal
          settings={data.settings}
          stringsPath={stringsPath}
          dataPath={dataPath}
          dataDir={dataDirPath}
          onChange={updateSettings}
          onLanguageChange={(language) => void changeLanguage(language)}
          onScaleChange={changeScale}
          onStageColorChange={changeStageColor}
          onResetColors={resetColors}
          onPickBackground={() => void pickBackground()}
          onRevealStrings={() => void revealStrings()}
          onReloadStrings={() => void reloadStrings()}
          onRevealDataDir={() => {
            void window.api.revealDataDir().catch((error) => notify(errorMessage(error), true))
          }}
          onRevealDataFile={() => {
            void window.api.revealDataFile().catch((error) => notify(errorMessage(error), true))
          }}
          onMoveDataDir={() => void moveDataDir()}
          onExport={() => void exportData()}
          onImport={() => void importData()}
          onPickFont={() => void pickFont()}
          onClose={() => setModal(null)}
        />
      ) : null}

      {toast ? <div className={`toast${toast.error ? ' toast--error' : ''}`}>{toast.text}</div> : null}
    </div>
  )
}