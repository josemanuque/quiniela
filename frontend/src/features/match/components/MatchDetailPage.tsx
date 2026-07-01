import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { ChevronLeft, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PredictionTier, PredictionWithProfile } from '@/types/domain.types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMatch } from '../hooks/useMatch'
import { useMyGroups } from '@/features/group/hooks/useMyGroups'
import { useGroupMembers } from '@/features/group/hooks/useGroupMembers'
import { useMatchPredictions } from '@/features/prediction/hooks/useMatchPredictions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TeamFlag } from './TeamFlag'
import { formatKickoffDate } from '../utils/matchUtils'
import {
  TIER_LABELS,
  TIER_BADGE_CLASSES,
  TIER_TEXT_CLASSES,
  computeLiveTier,
} from '@/features/prediction/utils/tierUtils'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MatchHeader({ match }: { match: NonNullable<ReturnType<typeof useMatch>['data']> }) {
  const hasPens = (match as Record<string, unknown>).home_penalties != null
  const hp = (match as Record<string, unknown>).home_penalties as number | null
  const ap = (match as Record<string, unknown>).away_penalties as number | null

  return (
    <div className="bg-zinc-900 px-4 pt-5 pb-4 border-b border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <TeamFlag flagUrl={match.home_team.flag_url} name={match.home_team.name} size="lg" />
          <span className="text-xs font-medium text-zinc-300 text-center leading-tight">
            {match.home_team.short_name}
          </span>
        </div>

        {/* Score / time */}
        <div className="flex flex-col items-center min-w-[100px]">
          {match.status === 'live' ? (
            <>
              <span className="text-3xl font-bold text-emerald-400 tabular-nums">
                {match.home_score ?? 0} – {match.away_score ?? 0}
              </span>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold">LIVE</span>
              </div>
            </>
          ) : match.status === 'completed' ? (
            <>
              <span className="text-3xl font-bold text-white tabular-nums">
                {match.home_score} – {match.away_score}
              </span>
              {hasPens ? (
                <div className="flex flex-col items-center mt-1">
                  <span className="text-[10px] text-zinc-500">Pens</span>
                  <span className="text-sm font-semibold text-zinc-400 tabular-nums">{hp} – {ap}</span>
                </div>
              ) : (
                <span className="text-xs text-zinc-500 mt-1">FT</span>
              )}
            </>
          ) : (
            <span className="text-zinc-500 text-sm">vs</span>
          )}
          <span className="text-[10px] text-zinc-600 mt-1.5">
            {formatKickoffDate(match.kickoff_at)} · {match.round.name}
          </span>
        </div>

        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <TeamFlag flagUrl={match.away_team.flag_url} name={match.away_team.name} size="lg" />
          <span className="text-xs font-medium text-zinc-300 text-center leading-tight">
            {match.away_team.short_name}
          </span>
        </div>
      </div>
    </div>
  )
}

function TierBadge({ tier }: { tier: PredictionTier }) {
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', TIER_BADGE_CLASSES[tier])}>
      {TIER_LABELS[tier]}
    </span>
  )
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

interface PredictionRowProps {
  pred:      PredictionWithProfile
  isMe:      boolean
  liveScore: { home_score: number; away_score: number } | null
  isLive:    boolean
}

function PredictionRow({ pred, isMe, liveScore, isLive }: PredictionRowProps) {
  const name = pred.profile.display_name
  const avatar = pred.profile.avatar_url

  // Determine display tier
  let displayTier: PredictionTier | null = null
  let displayPts: number | null = null

  if (pred.tier) {
    displayTier = pred.tier as PredictionTier
    displayPts  = pred.points_earned
  } else if (isLive && liveScore) {
    displayTier = computeLiveTier(
      { home_score: pred.home_score, away_score: pred.away_score },
      { home_score: liveScore.home_score, away_score: liveScore.away_score },
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg',
        isMe ? 'bg-emerald-950/40 ring-1 ring-emerald-800/40' : 'bg-zinc-900',
      )}
    >
      {/* Avatar */}
      <Avatar className="h-7 w-7 flex-shrink-0">
        <AvatarImage src={avatar ?? undefined} alt={name} referrerPolicy="no-referrer" />
        <AvatarFallback className="bg-zinc-700 text-zinc-300 text-[10px]">
          {initials(name)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <span className={cn('flex-1 text-sm truncate', isMe ? 'text-white font-medium' : 'text-zinc-300')}>
        {name}
        {isMe && <span className="ml-1 text-[10px] text-zinc-500">(you)</span>}
      </span>

      {/* Pick */}
      <span className={cn(
        'text-sm tabular-nums font-semibold',
        displayTier ? TIER_TEXT_CLASSES[displayTier] : 'text-zinc-300',
      )}>
        {pred.home_score} – {pred.away_score}
      </span>

      {/* Tier badge */}
      {displayTier && (
        <div className="flex-shrink-0 flex items-center gap-1.5">
          <TierBadge tier={displayTier} />
          {displayPts !== null ? (
            <span className={cn('text-xs font-semibold tabular-nums w-8 text-right', TIER_TEXT_CLASSES[displayTier])}>
              +{displayPts}
            </span>
          ) : isLive ? (
            <span className="text-[10px] text-zinc-600 w-8 text-right">live</span>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const ALL_SCOPE = 'all'

export function MatchDetailPage() {
  const { matchId } = useParams({ from: '/app/matches/$matchId' })
  const { user }    = useAuth()

  const { data: match }       = useMatch(matchId)
  const { data: myGroups }    = useMyGroups()
  const { data: predictions = [], isLoading } = useMatchPredictions(matchId)

  const [scope, setScope] = useState<string>(ALL_SCOPE)
  const { data: scopeMembers } = useGroupMembers(scope !== ALL_SCOPE ? scope : '')

  const isLive      = match?.status === 'live'
  const isCompleted = match?.status === 'completed'

  const liveScore = isLive && match.home_score != null && match.away_score != null
    ? { home_score: match.home_score, away_score: match.away_score }
    : null

  // Filter by selected group
  const displayed = scope === ALL_SCOPE
    ? predictions
    : predictions.filter(p =>
        scopeMembers?.some(m => (m as { user_id: string }).user_id === p.user_id)
      )

  // Sort: my prediction first, then by pts desc (confirmed), then by tier quality (live)
  const sorted = [...displayed].sort((a, b) => {
    if (a.user_id === user?.id) return -1
    if (b.user_id === user?.id) return  1
    if (a.points_earned !== null && b.points_earned !== null)
      return b.points_earned - a.points_earned
    return 0
  })

  const hasGroups = myGroups && myGroups.length > 0

  return (
    <div className="flex flex-col min-h-full bg-zinc-950">
      {/* Back nav */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <Link to="/app/matches" className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
          <ChevronLeft size={16} />
          Matches
        </Link>
      </div>

      {/* Match header */}
      {match && <MatchHeader match={match} />}

      {/* Upcoming guard */}
      {match?.status === 'upcoming' && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
          <div className="bg-zinc-800 rounded-full p-4">
            <Lock size={20} className="text-zinc-500" />
          </div>
          <p className="text-zinc-400 text-sm text-center">
            Predictions are hidden until kickoff
          </p>
        </div>
      )}

      {(isLive || isCompleted) && (
        <div className="max-w-2xl mx-auto w-full">
          {/* Group scope chips */}
          {hasGroups && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 pt-3 pb-2">
              <button
                onClick={() => setScope(ALL_SCOPE)}
                className={cn(
                  'flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium transition-colors',
                  scope === ALL_SCOPE
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
                )}
              >
                Everyone
              </button>
              {myGroups.map(g => (
                <button
                  key={g.id}
                  onClick={() => setScope(g.id)}
                  className={cn(
                    'flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium transition-colors',
                    scope === g.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
                  )}
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}

          {/* Predictions list */}
          <div className="flex-1 px-4 py-2 space-y-1.5 pb-6 max-w-2xl mx-auto w-full">
            {isLoading ? (
              <div className="space-y-1.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 bg-zinc-900 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2">
                <p className="text-zinc-500 text-sm">No predictions to show</p>
                {scope !== ALL_SCOPE && (
                  <p className="text-zinc-600 text-xs">Try switching to Everyone</p>
                )}
              </div>
            ) : (
              sorted.map(pred => (
                <PredictionRow
                  key={pred.user_id}
                  pred={pred}
                  isMe={pred.user_id === user?.id}
                  liveScore={liveScore}
                  isLive={isLive}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
