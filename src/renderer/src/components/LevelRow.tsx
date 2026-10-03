import type { ReactNode } from 'react'
import { t } from '@shared/strings'
import { STAGES, stageLabelKey, type AppSettings, type LevelPlan, type Stage } from '@shared/types'
import { demonlistLevelUrl, stageColors } from '../lib'
import VideoPreview from './VideoPreview'

interface LevelRowProps {
  level: LevelPlan
  settings: AppSettings | null
  /** Номер строки в текущем виде; 1 — первая. */
  position: number
  onMoveTo: (level: LevelPlan, position: number) => void
  onEdit: (level: LevelPlan) => void
  onDelete: (level: LevelPlan) => void
  onStageChange: (level: LevelPlan, stage: Stage) => void
  onOpenUrl: (url: string) => void
  draggable: boolean
  isDragging: boolean
  dropSide: 'before' | 'after' | null
  onDragStart: (level: LevelPlan) => void
  onDragEnter: (level: LevelPlan, event: React.DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onDrop: (level: LevelPlan) => void
}

export default function LevelRow({
  level,
  settings,
  position,
  onMoveTo,
  onEdit,
  onDelete,
  onStageChange,
  onOpenUrl,
  draggable,
  isDragging,
  dropSide,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop
}: LevelRowProps): ReactNode {
  const colors = stageColors(settings)
  const color = colors[level.stage]
  const demonlistUrl = demonlistLevelUrl(level)
  const hasPreview = Boolean(level.previewPath || level.videoUrl)
  const className = [
    'row',
    isDragging ? 'row--dragging' : '',
    dropSide === 'before' ? 'row--drop' : '',
    dropSide === 'after' ? 'row--drop-after' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={className}
      style={{ ['--stage-color' as string]: color }}
      onDragOver={(event) => {
        if (!draggable) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }}
      onDragEnter={(event) => onDragEnter(level, event)}
      onDragEnd={onDragEnd}
      onDrop={(event) => {
        event.preventDefault()
        onDrop(level)
      }}
    >
      {draggable ? (
        <span
          className="row__grip"
          draggable
          title={t('Перетащи строку, чтобы поменять местами уровни')}
          aria-hidden="true"
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', level.id)
            onDragStart(level)
          }}
        >
          ⠿
        </span>
      ) : (
        <span className="row__grip" aria-hidden="true" />
      )}

      {/* Номер строки всегда можно ввести: это самый быстрый способ поменять порядок. */}
      <input
        className="row__place row__place--input"
        type="number"
        min={1}
        value={position}
        title={
          level.placement !== null
            ? t('Позиция в GDL: #{place}. Введи номер, чтобы поставить уровень на это место', {
                place: level.placement
              })
            : t('Введи номер, чтобы поставить уровень на это место')
        }
        aria-label={t('Введи номер, чтобы поставить уровень на это место')}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next) && next > 0) onMoveTo(level, next)
        }}
      />

      {hasPreview ? (
        <button
          className="row__preview"
          onClick={() => level.videoUrl && onOpenUrl(level.videoUrl)}
          /* Название уровня видно при наведении на превью. */
          title={`${level.name} — ${t(level.previewPath ? 'Своё превью' : 'Открыть видео')}`}
          aria-label={`${t('Видео')} ${level.name}`}
        >
          <VideoPreview
            videoUrl={level.videoUrl}
            previewPath={level.previewPath}
            alt={level.name}
          />
        </button>
      ) : (
        <span className="row__preview row__preview--empty" aria-hidden="true" />
      )}

      {demonlistUrl ? (
        <button
          className="row__name row__name--link"
          onClick={() => onOpenUrl(demonlistUrl)}
          title={t('Открыть на demonlist.org')}
        >
          {level.name}
        </button>
      ) : (
        <span className="row__name" onDoubleClick={() => onEdit(level)} title={level.name}>
          {level.name}
        </span>
      )}

      <select
        className="row__stage"
        value={level.stage}
        onChange={(event) => onStageChange(level, event.target.value as Stage)}
        title={t('Статус')}
        style={{ color, borderColor: color }}
      >
        {STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {t(stageLabelKey(stage))}
          </option>
        ))}
      </select>

      <span className="row__progress" title={t('Прогресс')}>
        {level.progress || '—'}
      </span>

      <span className="row__attempts" title={t('Сколько попыток ушло на уровень')}>
        {level.attempts === null ? '—' : level.attempts}
      </span>

      <span className="row__actions">
        <button
          className="row__act"
          onClick={() => onEdit(level)}
          title={t('Открыть уровень')}
          aria-label={t('Открыть уровень')}
        >
          ✎
        </button>
        <button
          className="row__act row__act--danger"
          onClick={() => onDelete(level)}
          title={t('Удалить')}
          aria-label={t('Удалить')}
        >
          ✕
        </button>
      </span>
    </article>
  )
}