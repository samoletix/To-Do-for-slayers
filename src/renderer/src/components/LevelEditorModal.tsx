import { useEffect, useState, type ReactNode } from 'react'
import { t } from '@shared/strings'
import type { LevelDraft, LevelPlan } from '@shared/types'
import Modal from './Modal'
import LevelForm from './LevelForm'

interface LevelEditorModalProps {
  level: LevelPlan
  onSave: (draft: LevelDraft) => void
  onDelete: (level: LevelPlan) => void
  onClose: () => void
}

export default function LevelEditorModal({
  level,
  onSave,
  onDelete,
  onClose
}: LevelEditorModalProps): ReactNode {
  const toDraft = (item: LevelPlan): LevelDraft => ({
    name: item.name,
    source: item.source,
    demonlistId: item.demonlistId,
    ingameId: item.ingameId,
    placement: item.placement,
    creator: item.creator,
    verifier: item.verifier,
    videoUrl: item.videoUrl,
    previewPath: item.previewPath,
    difficulty: item.difficulty,
    popularity: item.popularity,
    attempts: item.attempts,
    progress: item.progress,
    stage: item.stage,
    comment: item.comment
  })

  const [draft, setDraft] = useState<LevelDraft>(toDraft(level))

  // Уровень мог измениться в фоне (например, при синхронизации) — подтягиваем свежие поля.
  useEffect(() => {
    setDraft((prev) => ({ ...toDraft(level), name: prev.name }))
  }, [level])

  const patch = (next: Partial<LevelDraft>): void => setDraft((prev) => ({ ...prev, ...next }))

  return (
    <Modal
      title={level.name}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--danger" onClick={() => onDelete(level)}>
            {t('Удалить')}
          </button>
          <span className="spacer" />
          <button className="btn" onClick={onClose}>
            {t('Отмена')}
          </button>
          <button
            className="btn btn--primary"
            disabled={!draft.name.trim()}
            onClick={() => onSave({ ...draft, name: draft.name.trim() })}
          >
            {t('Сохранить')}
          </button>
        </>
      }
    >
      {level.source === 'demonlist' && level.demonlistId ? (
        <p className="muted muted--sm">Global Demonlist ID {level.demonlistId}</p>
      ) : null}
      {/* Попытки пишутся только вручную — показываем их прямо в шапке формы. */}
      <label className="field">
        <span className="field__label">{t('Попытки')}</span>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          min={0}
          max={999999}
          value={draft.attempts === null ? '' : String(draft.attempts)}
          placeholder={t('Сколько попыток ушло на уровень')}
          onChange={(event) => {
            /* Только цифры, максимум 6: счётчик попыток не должен ломаться пробелами. */
            const digits = event.target.value.replace(/\D/g, '').slice(0, 6)
            patch({ attempts: digits ? Number(digits) : null })
          }}
        />
        <span className="field__hint">{t('Счётчик вручную: синхронизация его не меняет')}</span>
      </label>
      <LevelForm value={draft} onChange={patch} />
    </Modal>
  )
}
