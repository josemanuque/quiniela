import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { leaderboardService, type BreakdownTier } from '../services/leaderboardService'
import type { PredictionTier } from '@/types/domain.types'
import {
  TIER_LABELS,
  TIER_TEXT_CLASSES,
  TIER_BADGE_CLASSES,
  TIER_ROW_CLASSES,
} from '@/features/prediction/utils/tierUtils'

interface Props {
  userId: string
}

// BreakdownTier (DB function names) → PredictionTier (canonical app names)
const BREAKDOWN_TO_TIER: Record<BreakdownTier, PredictionTier> = {
  exact: 'exact',
  partial_correct: 'partial_correct_winner',
  correct_winner: 'correct_winner',
  partial_wrong: 'partial_wrong',
  miss: 'miss',
}

function Flag({ url, name }: { url: string | null; name: string }) {
  if (!url) return <div className="w-4 h-3 rounded-sm bg-zinc-700 flex-shrink-0" />
  return (
    <img
      src={url}
      alt={name}
      className="w-4 h-3 rounded-sm object-cover flex-shrink-0"
      loading="lazy"
    />
  )
}

export function LeaderboardBreakdown({ userId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['live-breakdown', userId],
    queryFn: () => leaderboardService.getUserLiveBreakdown(userId),
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div className="mt-2 space-y-1.5 px-1">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 bg-zinc-800/40 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <div className="mt-2 px-3 py-2 text-xs text-zinc-600">No live match predictions</div>
  }

  return (
    <div className="mt-2 space-y-1.5">
      {data.map((row) => {
        const tier = BREAKDOWN_TO_TIER[row.tier]
        return (
          <div key={row.match_id} className={cn('rounded-md px-3 py-2.5', TIER_ROW_CLASSES[tier])}>
            {/* Match + live score */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Flag url={row.home_team_flag} name={row.home_team_name} />
                <span className="text-xs text-zinc-300 truncate">{row.home_team_name}</span>
                <span className="text-xs font-bold text-white tabular-nums mx-0.5">
                  {row.live_home_score}–{row.live_away_score}
                </span>
                <span className="text-xs text-zinc-300 truncate">{row.away_team_name}</span>
                <Flag url={row.away_team_flag} name={row.away_team_name} />
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded px-1.5 py-0.5 flex-shrink-0">
                LIVE
              </span>
            </div>

            {/* Prediction + tier */}
            <div className="flex items-center justify-between mt-1.5 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500">Your pick:</span>
                <span className="text-xs font-semibold text-zinc-200 tabular-nums">
                  {row.pred_home_score}–{row.pred_away_score}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded',
                    TIER_BADGE_CLASSES[tier]
                  )}
                >
                  {TIER_LABELS[tier]}
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold tabular-nums flex-shrink-0',
                  TIER_TEXT_CLASSES[tier]
                )}
              >
                {row.provisional_pts > 0 ? `+${row.provisional_pts.toString()}` : '—'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
