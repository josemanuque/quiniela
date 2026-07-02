import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import type { MatchWithTeams, PredictionTier } from '@/types/domain.types'
import { formatKickoffDate, formatKickoffTime } from '../utils/matchUtils'
import { TeamFlag } from './TeamFlag'
import { PredictionInput } from '@/features/prediction/components/PredictionInput'
import { useMyPrediction } from '@/features/prediction/hooks/useMyPrediction'
import { TIER_BORDER_CLASSES } from '@/features/prediction/utils/tierUtils'

function ScoreOrTime({ match }: { match: MatchWithTeams }) {
  if (match.status === 'live') {
    return (
      <div className="text-center min-w-[88px]">
        <span className="text-emerald-400 font-bold text-2xl tabular-nums">
          {match.home_score ?? 0} – {match.away_score ?? 0}
        </span>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-semibold tracking-wide">LIVE</span>
        </div>
      </div>
    )
  }

  if (match.status === 'completed') {
    const hasPens = match.home_penalties != null
    return (
      <div className="text-center min-w-[88px]">
        <span className="text-white font-bold text-2xl tabular-nums">
          {match.home_score} – {match.away_score}
        </span>
        {hasPens ? (
          <div className="flex flex-col items-center mt-0.5">
            <span className="text-zinc-600 text-[10px]">AET</span>
            <span className="text-zinc-400 text-xs font-semibold tabular-nums">
              Pen {match.home_penalties}–{match.away_penalties}
            </span>
          </div>
        ) : (
          <div className="text-zinc-600 text-xs mt-0.5">FT</div>
        )}
      </div>
    )
  }

  return (
    <div className="text-center min-w-[88px]">
      <span className="text-zinc-300 text-base font-medium tabular-nums">
        {formatKickoffTime(match.kickoff_at)}
      </span>
    </div>
  )
}

export function MatchCard({ match }: { match: MatchWithTeams }) {
  const navigate = useNavigate()
  const { data: prediction } = useMyPrediction(match.id)

  const isClickable = match.status !== 'upcoming'
  const tier = prediction?.tier as PredictionTier | null | undefined

  function handleClick() {
    if (!isClickable) return
    void navigate({ to: '/app/matches/$matchId', params: { matchId: match.id } })
  }

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? e => e.key === 'Enter' && handleClick() : undefined}
      className={cn(
        'bg-zinc-900 rounded-lg px-4 py-4 border-l-2 transition-colors',
        isClickable && 'cursor-pointer hover:bg-zinc-800 active:bg-zinc-800',
        tier ? TIER_BORDER_CLASSES[tier] : 'border-l-transparent',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Home team */}
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <TeamFlag flagUrl={match.home_team.flag_url} name={match.home_team.name} size="md" />
          <span className="text-sm font-medium text-white truncate">{match.home_team.short_name}</span>
        </div>

        <ScoreOrTime match={match} />

        {/* Away team */}
        <div className="flex-1 flex items-center justify-end gap-2.5 min-w-0">
          <span className="text-sm font-medium text-white truncate text-right">{match.away_team.short_name}</span>
          <TeamFlag flagUrl={match.away_team.flag_url} name={match.away_team.name} size="md" />
        </div>
      </div>

      <div className="text-xs text-zinc-600 text-center mt-2">
        {formatKickoffDate(match.kickoff_at)} · {formatKickoffTime(match.kickoff_at)}
      </div>

      <PredictionInput match={match} />
    </div>
  )
}
