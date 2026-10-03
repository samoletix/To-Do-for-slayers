import { useState, type ReactNode } from 'react'
import { t } from '@shared/strings'
import type { LevelPlan, SyncReport } from '@shared/types'
import { errorMessage } from '../lib'
import Modal from './Modal'

interface SyncModalProps {
  levels: LevelPlan[]
  initialInput: string
  onApply: (levels: LevelPlan[], report: SyncReport, input: string) => void
  onClose: () => void
}

export default function SyncModal({
  levels,
  initialInput,
  onApply,
  onClose
}: SyncModalProps): ReactNode {
  const [input, setInput] = useState(initialInput)
  const [addNew, setAddNew] = useState(true)
  const [addUncompleted, setAddUncompleted] = useState(true)
  const [fetchDetails, setFetchDetails] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<SyncReport | null>(null)

  const run = async (): Promise<void> => {
    if (!input.trim()) {
      setError(t('Введи ник, ID или ссылку на профиль Global Demonlist'))
      return
    }
    setBusy(true)
    setError(null)
    setReport(null)
    try {
      const result = await window.api.syncUser({
        input: input.trim(),
        existing: levels,
        addNew,
        addUncompleted,
        fetchDetails
      })
      setReport(result.report)
      onApply(result.levels, result.report, input.trim())
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={t('Синхронизация с Global Demonlist')}
      onClose={onClose}
      size="slim"
      footer={
        <>
          <span className="spacer" />
          <button className="btn" onClick={onClose}>
            {t('Закрыть')}
          </button>
          <button className="btn btn--primary" onClick={() => void run()} disabled={busy}>
            {busy ? <span className="spinner" /> : t('Синхронизировать')}
          </button>
        </>
      }
    >
      <div className="notice">
        {t('Данные берутся из открытого профиля на demonlist.org — логин и пароль не нужны.')}
        <br />
        {t('Статусы «Заморожен», «Мечта» и «Мёртв» синхронизация не трогает.')}
        <br />
        {t('Поддерживаются: ник, ID или ссылка на профиль')}{' '}
        <code>Zoink</code>, <code>16498</code>,{' '}
        <code>https://demonlist.org/Zoink/</code>.
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}

      <div className="field">
        <label htmlFor="sy-input">{t('Ник, ID или ссылка')}</label>
        <input
          id="sy-input"
          className="input"
          value={input}
          placeholder="Zoink"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void run()
          }}
        />
      </div>

      <label className="check">
        <input type="checkbox" checked={addNew} onChange={(e) => setAddNew(e.target.checked)} />
        {t('Добавлять новые уровни из профиля')}
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={addUncompleted}
          onChange={(e) => setAddUncompleted(e.target.checked)}
        />
        {t('Добирать с листа уровни, которые игрок ещё не прошёл')}
      </label>
      <span className="field__hint" style={{ display: 'block', marginBottom: 7 }}>
        {t('В профиле их нет: список уровней Global Demonlist вычитается из профиля, остаток добавляется как «Планируется»')}
      </span>
      <label className="check">
        <input
          type="checkbox"
          checked={fetchDetails}
          onChange={(e) => setFetchDetails(e.target.checked)}
        />
        {t('Подтягивать автора, верификатора и ссылки (дополнительные запросы к API)')}
      </label>

      {report ? (
        <div className="report" style={{ marginTop: 14 }}>
          <div>
            <strong>{report.username}</strong>
            {report.placement
              ? t('Место в рейтинге: #{place}', { place: report.placement })
              : ''}
            {report.points ? t('Очки: {points}', { points: report.points }) : ''}
          </div>
          <div>
            {t('Пройдено: {done} · в процессе: {progress} · {message}', {
              done: report.completedTotal,
              progress: report.progressTotal,
              message: report.message
            })}
          </div>
          <div>
            {t('Не пройдено в листе: {n}{added}', {
              n: report.uncompletedTotal,
              added: report.uncompletedFetched
                ? ` · ${t('добавлено {n}', { n: report.uncompletedFetched })}`
                : ''
            })}
          </div>
          <div>
            {t('Профиль:')}{' '}
            <a
              href={report.profileUrl}
              onClick={(event) => {
                event.preventDefault()
                void window.api.openExternal(report.profileUrl)
              }}
            >
              {report.profileUrl}
            </a>
          </div>
          {report.added.length ? (
            <div>
              {t('Добавлены:')}{' '}
              {report.added
                .slice(0, 12)
                .map((item) =>
                  t('{name} ({done})', {
                    name: item.name,
                    done:
                      item.stage === 'completed'
                        ? t('пройден')
                        : item.progress || t('в процессе')
                  })
                )
                .join(', ')}
              {report.added.length > 12
                ? ` ${t('и ещё {n}', { n: report.added.length - 12 })}`
                : ''}
            </div>
          ) : null}
          {report.updated.length ? (
            <div>
              {t('Обновлены:')} {report.updated.slice(0, 12).map((item) => item.name).join(', ')}
              {report.updated.length > 12
                ? ` ${t('и ещё {n}', { n: report.updated.length - 12 })}`
                : ''}
            </div>
          ) : null}
          {report.skipped.length ? (
            <div>
              {t('Не трогал (заморожен/мечта/мёртв):')}{' '}
              {report.skipped.slice(0, 12).map((name) => name).join(', ')}
              {report.skipped.length > 12
                ? ` ${t('и ещё {n}', { n: report.skipped.length - 12 })}`
                : ''}
            </div>
          ) : null}
          {report.detailsFailed ? (
            <div>
              {t('Не удалось получить детали для {n} уровней.', { n: report.detailsFailed })}
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  )
}
