import { useEffect, useState, type ReactNode } from 'react'
import { SCALE_OPTIONS } from '@shared/defaults'
import { LANGUAGES, t } from '@shared/strings'
import { themeFallback } from '@shared/themes'
import {
  STAGES,
  THEME_IDS,
  THEME_LABELS,
  stageLabelKey,
  type AppSettings,
  type Language,
  type Stage,
  type ThemeId
} from '@shared/types'
import Modal from './Modal'

interface SettingsModalProps {
  settings: AppSettings
  stringsPath: string
  dataPath: string
  dataDir: string
  onChange: (patch: Partial<AppSettings>) => void
  onLanguageChange: (language: Language) => void
  onScaleChange: (scale: number) => void
  onStageColorChange: (stage: Stage, color: string) => void
  onResetColors: () => void
  onPickBackground: () => void
  onRevealStrings: () => void
  onReloadStrings: () => void
  onRevealDataDir: () => void
  onRevealDataFile: () => void
  onMoveDataDir: () => void
  onExport: () => void
  onImport: () => void
  onPickFont: () => void
  onClose: () => void
}

const LANGUAGE_LABELS: Record<Language, string> = {
  ru: 'Русский',
  en: 'Английский'
}

export default function SettingsModal({
  settings,
  stringsPath,
  dataPath,
  dataDir,
  onChange,
  onLanguageChange,
  onScaleChange,
  onStageColorChange,
  onResetColors,
  onPickBackground,
  onRevealStrings,
  onReloadStrings,
  onRevealDataDir,
  onRevealDataFile,
  onMoveDataDir,
  onExport,
  onImport,
  onPickFont,
  onClose
}: SettingsModalProps): ReactNode {
  const [fonts, setFonts] = useState<string[]>([])
  const theme = settings.theme
  const fallback = themeFallback(theme)

  useEffect(() => {
    let alive = true
    void window.api
      .systemFonts()
      .then((list) => {
        if (alive) setFonts(list)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const customFont = settings.fontFamily.startsWith('custom:')
    ? settings.fontFamily.slice('custom:'.length)
    : ''

  return (
    <Modal
      title={t('Настройки')}
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button className="btn btn--primary" onClick={onClose}>
            {t('Закрыть')}
          </button>
        </>
      }
    >
      <div className="filters__title">{t('Внешний вид')}</div>

      <div className="field">
        <label htmlFor="st-theme">{t('Шаблон оформления')}</label>
        <select
          id="st-theme"
          className="input"
          value={theme}
          onChange={(event) => onChange({ theme: event.target.value as ThemeId })}
        >
          {THEME_IDS.map((id) => (
            <option key={id} value={id}>
              {t(THEME_LABELS[id])}
            </option>
          ))}
        </select>
        <span className="field__hint">{t('Набор цветов, рамок и шрифта приложения')}</span>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="st-lang">{t('Язык')}</label>
          <select
            id="st-lang"
            className="input"
            value={settings.language}
            onChange={(event) => onLanguageChange(event.target.value as Language)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {t(LANGUAGE_LABELS[lang])}
              </option>
            ))}
          </select>
          <span className="field__hint">strings.txt / strings.en.txt</span>
        </div>

        <div className="field">
          <label htmlFor="st-scale">{t('Масштаб интерфейса')}</label>
          <select
            id="st-scale"
            className="input"
            value={settings.scale}
            onChange={(event) => onScaleChange(Number(event.target.value))}
          >
            {SCALE_OPTIONS.map((scale) => (
              <option key={scale} value={scale}>
                {scale}×
              </option>
            ))}
          </select>
          <span className="field__hint">{t('Как увеличить или уменьшить размер текста и элементов')}</span>
        </div>
      </div>

      <label className="check">
        <input
          type="checkbox"
          checked={settings.compact}
          onChange={(event) => onChange({ compact: event.target.checked })}
        />
        {t('Компактный режим')}
      </label>
      <span className="field__hint" style={{ display: 'block', marginBottom: 12 }}>
        {t('Убирает превью в строках: остаются название, позиция, прогресс и рамка цвета статуса')}
      </span>

      <div className="field">
        <label htmlFor="st-font">{t('Шрифт')}</label>
        <div className="field__line">
          <select
            id="st-font"
            className="input"
            value={customFont ? `custom:${customFont}` : settings.fontFamily}
            onChange={(event) => onChange({ fontFamily: event.target.value })}
          >
            <option value="">{t('Шрифт по умолчанию')}</option>
            {customFont ? <option value={`custom:${customFont}`}>{customFont}</option> : null}
            {fonts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button className="btn" onClick={onPickFont}>
            {t('Выбрать файл шрифта')}
          </button>
        </div>
        <span className="field__hint">{t('Шрифты из папки Fonts в Windows или свой файл .ttf/.otf')}</span>
      </div>

      <div className="colors colors--wide">
        <ColorField
          id="st-bg"
          label={t('Цвет фона')}
          value={settings.backgroundColor}
          fallback={fallback.background}
          onChange={(backgroundColor) => onChange({ backgroundColor })}
        />
        <ColorField
          id="st-object"
          label={t('Цвет фона объектов')}
          value={settings.objectColor}
          fallback={fallback.object}
          onChange={(objectColor) => onChange({ objectColor })}
        />
        <ColorField
          id="st-panel"
          label={t('Цвет панелей')}
          value={settings.panelColor}
          fallback={fallback.panel}
          onChange={(panelColor) => onChange({ panelColor })}
        />
        <ColorField
          id="st-btn"
          label={t('Цвет кнопок')}
          value={settings.buttonColor}
          fallback={fallback.button}
          onChange={(buttonColor) => onChange({ buttonColor })}
        />
        <ColorField
          id="st-fg"
          label={t('Цвет текста')}
          value={settings.textColor}
          fallback={fallback.text}
          onChange={(textColor) => onChange({ textColor })}
        />
      </div>
      <span className="field__hint" style={{ display: 'block', marginBottom: 8 }}>
        {t('«Цвет фона» красит только полосу позади плашек уровней, «Цвет фона объектов» — сами плашки')}
      </span>
      <button className="btn btn--sm" onClick={onResetColors} style={{ marginBottom: 14 }}>
        {t('Сбросить цвета')}
      </button>

      <div className="field">
        <label>{t('Фоновая картинка')}</label>
        <div className="field__line">
          <button className="btn" onClick={onPickBackground}>
            {t('Выбрать картинку')}
          </button>
          {settings.backgroundImage ? (
            <button
              className="btn btn--danger"
              onClick={() => {
                if (window.confirm(t('Удалить фоновое изображение?'))) {
                  onChange({ backgroundImage: '' })
                }
              }}
            >
              {t('Убрать картинку')}
            </button>
          ) : null}
          {settings.backgroundImage ? (
            <span className="path">{settings.backgroundImage}</span>
          ) : null}
        </div>
        <span className="field__hint">{t('Картинка на весь фон приложения, GIF тоже можно')}</span>
      </div>

      <div className="filters__title">{t('Цвета статусов')}</div>
      <div className="colors">
        {STAGES.map((stage) => (
          <label className="colors__item" key={stage}>
            <input
              type="color"
              className="color"
              value={settings.stageColors[stage]}
              onChange={(event) => onStageColorChange(stage, event.target.value)}
            />
            <span>{t(stageLabelKey(stage))}</span>
          </label>
        ))}
      </div>

      <div className="filters__title" style={{ marginTop: 16 }}>
        {t('Файлы и данные')}
      </div>

      <div className="field">
        <label>{t('Папка данных приложения')}</label>
        <span className="path">{dataDir}</span>
        <div className="field__line" style={{ marginTop: 6 }}>
          <button className="btn" onClick={onRevealDataDir}>
            {t('Показать папку')}
          </button>
          <button className="btn" onClick={onMoveDataDir}>
            {t('Переместить данные…')}
          </button>
        </div>
        <span className="field__hint">{t('Выбери папку, куда перенести файл данных, надписи, превью и шрифты')}</span>
      </div>

      <div className="field">
        <label>{t('Файл сохранения')}</label>
        <span className="path">{dataPath}</span>
        <div className="field__line" style={{ marginTop: 6 }}>
          <button className="btn" onClick={onRevealDataFile}>
            {t('Показать файл в проводнике')}
          </button>
          <button className="btn" onClick={onExport}>
            {t('Экспорт копии')}
          </button>
          <button className="btn" onClick={onImport}>
            {t('Импорт из файла')}
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="st-strings">{t('Файл с надписями')}</label>
        <div className="field__line">
          <input id="st-strings" className="input" readOnly value={stringsPath} />
          <button className="btn" onClick={onRevealStrings}>
            {t('Открыть папку')}
          </button>
          <button className="btn btn--primary" onClick={onReloadStrings}>
            {t('Обновить надписи')}
          </button>
        </div>
        <span className="field__hint">
          {t('В файле каждая строка имеет вид «надпись - новая надпись». Оставь правую часть пустой, чтобы не менять.')}
        </span>
        <span className="field__hint">
          {t('Сохрани файл — надписи обновятся в приложении сразу, перезапускать не нужно.')}
        </span>
      </div>
    </Modal>
  )
}

interface ColorFieldProps {
  id: string
  label: string
  value: string
  fallback: string
  onChange: (value: string) => void
}

/** Поле цвета: пустое значение означает «взять цвет из шаблона». */
function ColorField({ id, label, value, fallback, onChange }: ColorFieldProps): ReactNode {
  return (
    <div className="field colors__field">
      <label className="colors__label" htmlFor={id}>
        {label}
      </label>
      {/* Образец и кнопка стоят друг под другом: в общей сетке они наезжали друг на друга. */}
      <div className="colors__swatch">
        <input
          id={id}
          type="color"
          className="color"
          value={value || fallback}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="colors__value">{value || fallback}</span>
      </div>
      <button className="btn btn--sm colors__reset" onClick={() => onChange('')}>
        {value ? t('Сбросить') : t('Цвет из шаблона')}
      </button>
    </div>
  )
}