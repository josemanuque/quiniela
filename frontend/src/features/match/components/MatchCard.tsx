import { cn } from '@/lib/utils'
import type { MatchWithTeams } from '@/types/domain.types'
import { formatKickoffDate, formatKickoffTime } from '../utils/matchUtils'
import { TeamFlag } from './TeamFlag'
import { PredictionInput } from '@/features/prediction/components/PredictionInput'

interface MatchCardProps {
  match: MatchWithTeams
  onClick?: () => void
}

function ScoreOrTime({ match }: { match: MatchWithTeams }) {
  if (match.status === 'live') {
    return (
      <div className="text-center min-w-[64px]">
        <span className="text-emerald-400 font-bold text-base tabular-nums">
          {match.home_score ?? 0} – {match.away_score ?? 0}
        </span>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-[10px] font-semibold tracking-wide">LIVE</span>
        </div>
      </div>
    )
  }

  if (match.status === 'completed') {
    return (
      <div className="text-center min-w-[64px]">
        <span className="text-white font-bold text-base tabular-nums">
          {match.home_score} – {match.away_score}
        </span>
        <div className="text-zinc-600 text-[10px] mt-0.5">FT</div>
      </div>
    )
  }

  return (
    <div className="text-center min-w-[64px]">
      <span className="text-zinc-300 text-sm font-medium tabular-nums">
        {formatKickoffTime(match.kickoff_at)}
      </span>
    </div>
  )
}

export function MatchCard({ match, onClick }: MatchCardProps) {
  const isClickable = !!onClick

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? e => e.key === 'Enter' && onClick?.() : undefined}
      className={cn(
        'bg-zinc-900 rounded-lg px-4 py-3',
        isClickable && 'cursor-pointer hover:bg-zinc-800 active:bg-zinc-800 transition-colors',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Home team */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <TeamFlag flagUrl={match.home_team.flag_url} name={match.home_team.name} size="sm" />
          <span className="text-sm text-white truncate">{match.home_team.short_name}</span>
        </div>

        <ScoreOrTime match={match} />

        {/* Away team */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className="text-sm text-white truncate text-right">{match.away_team.short_name}</span>
          <TeamFlag flagUrl={match.away_team.flag_url} name={match.away_team.name} size="sm" />
        </div>
      </div>

      <div className="text-[11px] text-zinc-600 text-center mt-1.5">
        {formatKickoffDate(match.kickoff_at)} · {formatKickoffTime(match.kickoff_at)}
      </div>

      <PredictionInput match={match} />
    </div>
  )
}
