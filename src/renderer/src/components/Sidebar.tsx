import type { ReactNode } from 'react'
import { t } from '@shared/strings'
import { STAGES, stageLabelKey, type AppSettings, type LevelPlan, type Stage } from '@shared/types'
import { stageColors } from '../lib'

interface SidebarProps {
  levels: LevelPlan[]
  activeStages: Stage[]
  settings: AppSettings | null
  onToggleStage: (stage: Stage) => void
  onResetStages: () => void
  onOpenSettings: () => void
}

export default function Sidebar({
  levels,
  activeStages,
  settings,
  onToggleStage,
  onResetStages,
  onOpenSettings
}: SidebarProps): ReactNode {
  const counts = new Map<Stage, number>()
  for (const level of levels) counts.set(level.stage, (counts.get(level.stage) ?? 0) + 1)
  const total = levels.length
  const colors = stageColors(settings)

  return (
    <aside className="sidebar">
      <div className="filters">
        <div className="filters__title">
          {t('Фильтр по статусам')}
          {activeStages.length ? (
            <button className="filters__reset" onClick={onResetStages}>
              {t('Сбросить фильтры')}
            </button>
          ) : null}
        </div>
        {STAGES.map((item) => (
          <label className="filter" key={item}>
            <input
              type="checkbox"
              checked={activeStages.includes(item)}
              onChange={() => onToggleStage(item)}
            />
            <span className="filter__dot" style={{ background: colors[item] }} />
            <span className="filter__name">{t(stageLabelKey(item))}</span>
            <span className="filter__count">{counts.get(item) ?? 0}</span>
          </label>
        ))}
      </div>

      <div
        className="bar"
        title={t('Пройдено {done} из {total}', {
          done: counts.get('completed') ?? 0,
          total
        })}
      >
        {total
          ? STAGES.map((item) => {
              const value = counts.get(item) ?? 0
              if (!value) return null
              return (
                <span
                  key={item}
                  style={{ width: `${(value / total) * 100}%`, background: colors[item] }}
                />
              )
            })
          : null}
      </div>

      <div className="stats">
        <div className="stats__row">
          <span>{t('Всего')}</span>
          <strong>{total}</strong>
        </div>
        <div className="stats__row">
          <span>{t('Пройдено')}</span>
          <strong>{counts.get('completed') ?? 0}</strong>
        </div>
      </div>

      <button
        className="sidebar__settings"
        onClick={onOpenSettings}
        title={t('Настройки')}
        aria-label={t('Настройки')}
      >
        ⚙
      </button>
    </aside>
  )
}