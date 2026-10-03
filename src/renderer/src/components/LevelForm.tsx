import { useEffect, useState, type ReactNode } from 'react'
import { t } from '@shared/strings'
import { STAGES, stageLabelKey, type LevelDraft } from '@shared/types'
import { assetDataUrl, errorMessage } from '../lib'

interface LevelFormProps {
  value: LevelDraft
  onChange: (patch: Partial<LevelDraft>) => void
  children?: ReactNode
}

/** Попытки — целое неотрицательное число; пусто значит «не задано». Фановость — свободный текст. */

export default function LevelForm({ value, onChange, children }: LevelFormProps): ReactNode {
  const [thumb, setThumb] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clipHint, setClipHint] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setThumb(null)
    if (!value.previewPath) return
    void assetDataUrl(value.previewPath).then((url) => {
      if (alive) setThumb(url)
    })
    return () => {
      alive = false
    }
  }, [value.previewPath])

  const pickImage = async (): Promise<void> => {
    setError(null)
    try {
      const picked = await window.api.pickImage()
      if (picked) onChange({ previewPath: picked })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  /** Вставка превью из буфера обмена — картинка сразу сохраняется в папку превью. */
  const pasteImage = async (): Promise<void> => {
    setError(null)
    setClipHint(null)
    try {
      const saved = await window.api.previewFromClipboard()
      onChange({ previewPath: saved })
    } catch (err) {
      setError(errorMessage(err))
      setClipHint(t('В буфере обмена нет картинки'))
    }
  }

  /** Показать картинку из буфера, не сохраняя её. */
  const previewClipboard = async (): Promise<void> => {
    setClipHint(null)
    try {
      const url = await window.api.clipboardImage()
      setThumb(url)
      setClipHint(t('Картинка вместо превью ролика'))
    } catch (err) {
      setError(errorMessage(err))
      setClipHint(t('В буфере обмена нет картинки'))
    }
  }

  return (
    <div className="form">
      <div className="form__row">
        <div className="field field--grow">
          <label htmlFor="lf-name">{t('Название уровня *')}</label>
          <input
            id="lf-name"
            className="input"
            value={value.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder={t('Например: Bloodbath')}
          />
        </div>
        <div className="field">
          <label htmlFor="lf-stage">{t('Статус')}</label>
          <select
            id="lf-stage"
            className="input"
            value={value.stage}
            onChange={(event) => onChange({ stage: event.target.value as LevelDraft['stage'] })}
          >
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {t(stageLabelKey(stage))}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="lf-progress">{t('Прогресс')}</label>
          <input
            id="lf-progress"
            className="input"
            value={value.progress}
            onChange={(event) => onChange({ progress: event.target.value })}
            placeholder={t('Примеры: 27-100, 99.96%, 75, 100%')}
          />
        </div>
        <div className="field">
          <label htmlFor="lf-popularity">{t('Фановость')}</label>
          <input
            id="lf-popularity"
            className="input"
            value={value.popularity}
            onChange={(event) => onChange({ popularity: event.target.value })}
            placeholder={t('Любой текст: 95, топ, легенда')}
          />
        </div>
        </div>

      <div className="field">
        <label htmlFor="lf-video">{t('Ссылка на видео прохождения')}</label>
        <input
          id="lf-video"
          className="input"
          value={value.videoUrl}
          onChange={(event) => onChange({ videoUrl: event.target.value })}
          placeholder="https://youtu.be/…"
        />
        <span className="field__hint">{t('Ролик прохождения от самого слеера, не ролик верификатора')}</span>
      </div>

      <div className="field">
        <label>{t('Своё превью')}</label>
        <div className="field__line">
          <button className="btn" onClick={() => void pickImage()}>
            {t('Выбрать изображение')}
          </button>
          <button className="btn" onClick={() => void pasteImage()} title={t('Вставить из буфера')}>
            {t('Вставить из буфера')}
          </button>
          <button
            className="btn"
            onClick={() => void previewClipboard()}
            title={t('Превью недоступно')}
          >
            {t('Посмотреть из буфера')}
          </button>
          {value.previewPath ? (
            <button
              className="btn btn--danger"
              onClick={() => {
                if (window.confirm(t('Убрать своё превью?'))) onChange({ previewPath: '' })
              }}
            >
              {t('Убрать превью')}
            </button>
          ) : null}
          {thumb ? <img className="thumb" src={thumb} alt={t('Своё превью')} /> : null}
        </div>
        <span className="field__hint">{t('Картинка вместо превью ролика')}</span>
        {clipHint ? <span className="field__hint">{clipHint}</span> : null}
        {value.previewPath ? <span className="field__ok">{t('Превью обновлено')}</span> : null}
        {error ? <span className="form__error">{error}</span> : null}
      </div>

      <div className="field">
        <label htmlFor="lf-difficulty">{t('Мнение о сложности')}</label>
        <textarea
          id="lf-difficulty"
          className="input"
          value={value.difficulty}
          onChange={(event) => onChange({ difficulty: event.target.value })}
          placeholder={t('Свободным текстом: где подвох, сколько попыток ушло')}
        />
      </div>

      <div className="field">
        <label htmlFor="lf-comment">{t('Комментарий')}</label>
        <textarea
          id="lf-comment"
          className="input"
          value={value.comment}
          onChange={(event) => onChange({ comment: event.target.value })}
          placeholder={t('Заметки, идеи, тайминги')}
        />
      </div>

      <details className="details">
        <summary className="details__summary">{t('Дополнительно')}</summary>
        <div className="form__row">
          <div className="field">
            <label htmlFor="lf-creator">{t('Автор')}</label>
            <input
              id="lf-creator"
              className="input"
              value={value.creator}
              onChange={(event) => onChange({ creator: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="lf-verifier">{t('Верификатор')}</label>
            <input
              id="lf-verifier"
              className="input"
              value={value.verifier}
              onChange={(event) => onChange({ verifier: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="lf-ingame">{t('ID в Geometry Dash')}</label>
            <input
              id="lf-ingame"
              className="input"
              inputMode="numeric"
              value={value.ingameId ?? ''}
              onChange={(event) => onChange({ ingameId: toInt(event.target.value) })}
            />
          </div>
          <div className="field">
            <label htmlFor="lf-placement">{t('Позиция в списке')}</label>
            <input
              id="lf-placement"
              className="input"
              inputMode="numeric"
              value={value.placement ?? ''}
              onChange={(event) => onChange({ placement: toInt(event.target.value) })}
            />
          </div>
        </div>
      </details>

      {children}
    </div>
  )
}

function toInt(value: string): number | null {
  const raw = value.trim()
  if (!raw) return null
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, Math.trunc(parsed))
}
