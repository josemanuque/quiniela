import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { leaderboardService, type BreakdownTier } from '../services/leaderboardService'

interface Props {
  userId: string
}

const TIER_STYLES: Record<BreakdownTier, { label: string; pts: string; row: string; badge: string }> = {
  exact:           { label: 'Exact score!',          pts: 'text-amber-400',   row: 'border-l-2 border-amber-500/50 bg-amber-500/5',    badge: 'bg-amber-500/20 text-amber-400'   },
  partial_correct: { label: 'Partial + winner',       pts: 'text-emerald-400', row: 'border-l-2 border-emerald-500/50 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-400' },
  correct_winner:  { label: 'Correct winner',         pts: 'text-sky-400',     row: 'border-l-2 border-sky-500/50 bg-sky-500/5',        badge: 'bg-sky-500/20 text-sky-400'       },
  partial_wrong:   { label: 'Partial + wrong winner', pts: 'text-orange-400',  row: 'border-l-2 border-orange-500/50 bg-orange-500/5',  badge: 'bg-orange-500/20 text-orange-400' },
  miss:            { label: 'Miss',                   pts: 'text-zinc-500',    row: 'border-l-2 border-zinc-700/50 bg-zinc-800/30',     badge: 'bg-zinc-700 text-zinc-400'        },
}

function Flag({ url, name }: { url: string | null; name: string }) {
  if (!url) return <div className="w-4 h-3 rounded-sm bg-zinc-700 flex-shrink-0" />
  return <img src={url} alt={name} className="w-4 h-3 rounded-sm object-cover flex-shrink-0" loading="lazy" />
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
        {[1, 2].map(i => (
          <div key={i} className="h-12 bg-zinc-800/40 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="mt-2 px-3 py-2 text-xs text-zinc-600">
        No live match predictions
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-1.5">
      {data.map(row => {
        const style = TIER_STYLES[row.tier]
        return (
          <div key={row.match_id} className={cn('rounded-md px-3 py-2.5', style.row)}>
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
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', style.badge)}>
                  {style.label}
                </span>
              </div>
              <span className={cn('text-sm font-bold tabular-nums flex-shrink-0', style.pts)}>
                {row.provisional_pts > 0 ? `+${row.provisional_pts}` : '—'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
