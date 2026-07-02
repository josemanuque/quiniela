import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useGroupTrajectory, type Granularity } from '../hooks/useGroupTrajectory'
import { PointsTrajectoryChart } from './PointsTrajectoryChart'
import { ExactCountChart } from './ExactCountChart'
import type { GlobalLeaderboardRow } from '../services/leaderboardService'

interface Props {
  groupId: string
  confirmedRows: GlobalLeaderboardRow[]
  currentUserId: string | undefined
}

export function GroupStatsPanel({ groupId, confirmedRows, currentUserId }: Props) {
  const { t } = useTranslation()
  const [granularity, setGranularity] = useState<Granularity>('round')
  const { data: trajectoryRows, isLoading } = useGroupTrajectory(groupId, granularity)

  const GRANULARITIES: { key: Granularity; label: string }[] = [
    { key: 'round', label: t('granularity.round') },
    { key: 'day', label: t('granularity.day') },
    { key: 'match', label: t('granularity.match') },
  ]

  const hasExacts = confirmedRows.some((r) => r.exact_count > 0)

  return (
    <div className="mt-2 space-y-4 border-t border-zinc-800 pt-5 max-w-2xl mx-auto w-full px-4 pb-6">
      {/* Points trajectory */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {t('leaderboard.trajectoryTitle')}
          </h3>
          <div className="flex gap-0.5 bg-zinc-900 rounded-full p-0.5">
            {GRANULARITIES.map((g) => (
              <button
                key={g.key}
                onClick={() => {
                  setGranularity(g.key)
                }}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
                  granularity === g.key
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-[220px] rounded-xl bg-zinc-900 animate-pulse" />
        ) : !trajectoryRows || trajectoryRows.length === 0 ? (
          <div className="h-[220px] rounded-xl bg-zinc-900 flex items-center justify-center">
            <p className="text-zinc-600 text-sm">{t('leaderboard.noScoredYet')}</p>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-xl p-3 pt-4">
            <PointsTrajectoryChart rows={trajectoryRows} granularity={granularity} />
          </div>
        )}
      </div>

      {/* Exact score comparison */}
      {(hasExacts || confirmedRows.length > 0) && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            {t('leaderboard.exactScoresTitle')}
          </h3>
          <div className="bg-zinc-900 rounded-xl p-3 pt-4">
            <ExactCountChart rows={confirmedRows} currentUserId={currentUserId} />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1.5 text-center">
            {t('leaderboard.yourBarHighlighted')}
          </p>
        </div>
      )}
    </div>
  )
}
