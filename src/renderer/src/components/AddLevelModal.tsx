import { useState, type ReactNode } from 'react'
import { emptyDraft } from '@shared/defaults'
import { t } from '@shared/strings'
import {
  DEMONLIST_LIST_LABELS,
  type DemonlistListType,
  type LevelDraft
} from '@shared/types'
import { errorMessage, parsePlacementId } from '../lib'
import LevelForm from './LevelForm'
import Modal from './Modal'

interface SearchResult {
  id: number
  ingame_id: number
  placement: number
  name: string
  points: string | number
  list_percent: number
  length: number
  verifier: { user_id: number; username: string }
  verification_url: string
}

interface LevelDetail {
  id: number
  ingame_id: number
  placement: number
  name: string
  creator: string
  verification: { user_id: number; username: string; video_url: string }
}

interface AddLevelModalProps {
  existingDemonlistIds: number[]
  onCreate: (draft: LevelDraft) => void
  onClose: () => void
}

const LIST_TYPES: DemonlistListType[] = ['main', 'extended', 'advanced', 'unbounded']

const CLASSIC_LIST_LABEL: Record<DemonlistListType, string> = {
  main: 'Main',
  extended: 'Extended',
  advanced: 'Advanced',
  unbounded: 'Unbounded'
}

export default function AddLevelModal({
  existingDemonlistIds,
  onCreate,
  onClose
}: AddLevelModalProps): ReactNode {
  const [tab, setTab] = useState<'demonlist' | 'custom'>('demonlist')
  const [search, setSearch] = useState('')
  const [listType, setListType] = useState<DemonlistListType | ''>('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [direct, setDirect] = useState('')
  const [added, setAdded] = useState<string[]>([])
  const [custom, setCustom] = useState<LevelDraft>(emptyDraft())

  const runSearch = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const found = (await window.api.searchLevels({
        search: search.trim() || undefined,
        listType,
        limit: 50,
        offset: 0
      })) as unknown as SearchResult[]
      setResults(found)
      if (!found.length) {
        setError(t('Ничего не найдено. Попробуй другое название или выбери другой лист.'))
      }
    } catch (err) {
      setError(errorMessage(err))
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const addDemonlistLevel = async (id: number): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const detail = (await window.api.getLevel(id)) as unknown as LevelDetail
      onCreate({
        ...emptyDraft(),
        name: detail.name,
        source: 'demonlist',
        demonlistId: detail.id,
        ingameId: detail.ingame_id ?? null,
        placement: detail.placement ?? null,
        creator: detail.creator ?? '',
        verifier: detail.verification?.username ?? ''
      })
      setAdded((prev) => [...prev, detail.name])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  /** Один уровень без листа: сюда попадают и непроверенные уровни, которых нет в листе. */
  const searchSingle = async (): Promise<void> => {
    const id = parsePlacementId(search.trim() || direct)
    if (id === null) return
    await addDemonlistLevel(id)
  }

  const addById = async (): Promise<void> => {
    const id = parsePlacementId(direct)
    if (id === null) {
      setError(
        t('Нужен ID уровня (например 3436) или ссылка вида https://demonlist.org/classic/3436')
      )
      return
    }
    await addDemonlistLevel(id)
  }

  return (
    <Modal
      title={t('Добавить уровень')}
      onClose={onClose}
      footer={
        tab === 'custom' ? (
          <>
            <span className="spacer" />
            <button className="btn" onClick={onClose}>
              {t('Отмена')}
            </button>
            <button
              className="btn btn--primary"
              disabled={!custom.name.trim()}
              onClick={() => {
                onCreate({ ...custom, name: custom.name.trim(), source: 'custom' })
                onClose()
              }}
            >
              {t('Добавить')}
            </button>
          </>
        ) : (
          <>
            {added.length ? (
              <span className="muted">{t('Добавлено: {n}', { n: added.length })}</span>
            ) : null}
            <span className="spacer" />
            <button className="btn btn--primary" onClick={onClose}>
              {t('Готово')}
            </button>
          </>
        )
      }
    >
      <div className="tabs">
        <button
          className={tab === 'demonlist' ? 'is-active' : ''}
          onClick={() => setTab('demonlist')}
        >
          Global Demonlist
        </button>
        <button className={tab === 'custom' ? 'is-active' : ''} onClick={() => setTab('custom')}>
          {t('Свой уровень')}
        </button>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}

      {tab === 'demonlist' ? (
        <>
          <div className="field">
            <div className="field__line">
              <input
                id="al-search"
                className="input"
                value={search}
                placeholder={t('Название уровня')}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void searchSingle()
                }}
              />
              <select
                className="input"
                value={listType}
                onChange={(event) => setListType(event.target.value as DemonlistListType | '')}
              >
                <option value="">{t('Все листы')}</option>
                {LIST_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(DEMONLIST_LIST_LABELS[type])}
                  </option>
                ))}
              </select>
              <button className="btn btn--primary" onClick={() => void runSearch()} disabled={loading}>
                {loading ? <span className="spinner" /> : t('Найти')}
              </button>
              <button
                className="btn"
                onClick={() => void searchSingle()}
                disabled={loading}
                title={t('Найти уровень по ID, даже если его нет в листе')}
              >
                {t('Найти по ID')}
              </button>
            </div>
          </div>

          <div className="field">
            <div className="field__line">
              <input
                id="al-direct"
                className="input"
                value={direct}
                placeholder={t('3436 или https://demonlist.org/classic/3436')}
                onChange={(event) => setDirect(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void addById()
                }}
              />
              <button className="btn" onClick={() => void addById()} disabled={loading}>
                {t('Добавить')}
              </button>
            </div>
          </div>

          <div className="results">
            {results.map((item) => {
              const already = existingDemonlistIds.includes(item.id)
              return (
                <div className="result" key={item.id}>
                  <span className="result__place">#{item.placement}</span>
                  <span className="result__name">{item.name}</span>
                  <span className="result__meta">
                    {listType ? CLASSIC_LIST_LABEL[listType] : t('Все листы')} ·{' '}
                    {t('{points} очк. · {percent}%', {
                      points: item.points,
                      percent: item.list_percent
                    })}
                  </span>
                  <button
                    className="btn btn--sm btn--primary"
                    onClick={() => void addDemonlistLevel(item.id)}
                    disabled={loading || already}
                  >
                    {already ? t('Есть') : t('+ В план')}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <LevelForm
          value={custom}
          onChange={(patch) => setCustom((prev) => ({ ...prev, ...patch }))}
        />
      )}
    </Modal>
  )
}
