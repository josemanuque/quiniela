import { useState } from 'react'
import { Trophy, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMyGroups } from '@/features/group/hooks/useMyGroups'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useRoundLeaderboard } from '../hooks/useRoundLeaderboard'
import { LeaderboardRow } from './LeaderboardRow'
import { GroupStatsPanel } from './GroupStatsPanel'
import type { LeaderboardRound } from '../services/leaderboardService'

type Tab = 'projected' | 'confirmed'

interface RoundFilter {
  key: LeaderboardRound
  labelKey: string
}

const ROUND_FILTERS: RoundFilter[] = [
  { key: 'group_1', labelKey: 'leaderboard.roundR1' },
  { key: 'group_2', labelKey: 'leaderboard.roundR2' },
  { key: 'group_3', labelKey: 'leaderboard.roundR3' },
  { key: 'r32', labelKey: 'leaderboard.roundR32' },
  { key: 'r16', labelKey: 'leaderboard.roundR16' },
  { key: 'qf', labelKey: 'leaderboard.roundQF' },
  { key: 'sf', labelKey: 'leaderboard.roundSF' },
  { key: 'final', labelKey: 'leaderboard.roundFinal' },
]

export function LeaderboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: myGroups } = useMyGroups()

  const [scope, setScope] = useState<string>('global')
  const [tab, setTab] = useState<Tab>('projected')
  const [roundFilter, setRoundFilter] = useState<LeaderboardRound | null>(null)

  const groupId = scope === 'global' ? undefined : scope
  const activeGroup = myGroups?.find((g) => g.id === groupId)
  const { confirmed, projected, hasLiveMatches } = useLeaderboard(groupId)
  const { data: roundRows, isLoading: roundLoading } = useRoundLeaderboard(roundFilter, groupId)

  const activeTab = hasLiveMatches ? tab : 'confirmed'
  const allRows =
    activeTab === 'projected'
      ? (projected.data ?? [])
      : (confirmed.data?.map((r) => ({
          ...r,
          projected_points: 'total_points' in r ? r.total_points : 0,
          confirmed_points: 'total_points' in r ? r.total_points : 0,
        })) ?? [])

  const isLoading = roundFilter
    ? roundLoading
    : activeTab === 'projected'
      ? projected.isLoading
      : confirmed.isLoading

  const hasGroups = myGroups && myGroups.length > 0

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 min-h-full pb-14">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-white font-semibold text-base">{t('leaderboard.title')}</h1>
      </div>

      {/* Scope selector */}
      {hasGroups && (
        <div className="relative border-b border-zinc-800">
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
          <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2.5">
            <button
              onClick={() => {
                setScope('global')
              }}
              className={cn(
                'flex-shrink-0 h-8 px-3.5 rounded-full text-sm font-medium transition-colors',
                scope === 'global'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              )}
            >
              {t('leaderboard.global')}
            </button>
            {myGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setScope(group.id)
                }}
                className={cn(
                  'flex-shrink-0 h-8 px-3.5 rounded-full text-sm font-medium transition-colors',
                  scope === group.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                )}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Group stakes banner */}
      {activeGroup?.stakes && (
        <div className="mx-4 mt-3 bg-amber-500/8 border border-amber-500/20 rounded-lg px-4 py-2.5 flex items-start gap-2.5">
          <Star size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-200/70 text-sm">{activeGroup.stakes}</p>
        </div>
      )}

      {/* Jornada filter pills */}
      <div className="relative border-b border-zinc-800">
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
        <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2.5">
          <button
            onClick={() => {
              setRoundFilter(null)
            }}
            className={cn(
              'flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium transition-colors',
              roundFilter === null
                ? 'bg-zinc-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            )}
          >
            {t('leaderboard.filterAll')}
          </button>
          {ROUND_FILTERS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => {
                setRoundFilter(key)
              }}
              className={cn(
                'flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium transition-colors',
                roundFilter === key
                  ? 'bg-zinc-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Projected / Confirmed tab switcher — only when viewing all + live matches exist */}
      {!roundFilter && hasLiveMatches && (
        <div className="flex items-center gap-2 px-4 mt-3 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-1.5 bg-zinc-900 rounded-full p-0.5 flex-1">
            {(['projected', 'confirmed'] as Tab[]).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => {
                  setTab(tabKey)
                }}
                className={cn(
                  'flex-1 py-1.5 rounded-full text-xs font-medium transition-colors',
                  activeTab === tabKey
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-300'
                )}
              >
                {tabKey === 'projected' ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t('leaderboard.projected')}
                  </span>
                ) : (
                  t('leaderboard.confirmed')
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Column headers */}
      {!isLoading && (roundFilter ? (roundRows ?? []) : allRows).length > 0 && (
        <div className="flex items-center gap-3 px-8 pt-3 pb-1 max-w-2xl mx-auto w-full">
          <span className="w-6" />
          <span className="w-8" />
          <span className="flex-1 text-[10px] text-zinc-600 uppercase tracking-wider font-medium">
            {t('leaderboard.player')}
          </span>
          {!roundFilter && (
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium w-9 text-right">
              {t('leaderboard.exact')}
            </span>
          )}
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium w-8 text-right">
            {t('leaderboard.pts')}
          </span>
        </div>
      )}

      {/* Rows */}
      <div className="px-4 py-1 space-y-1.5 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="space-y-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-zinc-900 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : roundFilter ? (
          // Per-jornada view
          !roundRows || roundRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="bg-zinc-800 rounded-full p-5">
                <Trophy size={28} className="text-zinc-500" />
              </div>
              <p className="text-white font-medium">{t('leaderboard.noRankings')}</p>
            </div>
          ) : (
            roundRows.map((row) => (
              <LeaderboardRow
                key={row.user_id}
                userId={row.user_id}
                rank={row.rank}
                displayName={row.display_name}
                avatarUrl={row.avatar_url}
                points={row.jornada_pts}
                isCurrentUser={row.user_id === user?.id}
                showSub={false}
                expandable={false}
              />
            ))
          )
        ) : allRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="bg-zinc-800 rounded-full p-5">
              <Trophy size={28} className="text-zinc-500" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">{t('leaderboard.noRankings')}</p>
              <p className="text-zinc-500 text-sm mt-1">
                {scope === 'global'
                  ? t('leaderboard.makePredictions')
                  : t('leaderboard.groupNeedsPredictions')}
              </p>
            </div>
          </div>
        ) : (
          allRows.map((row) => (
            <LeaderboardRow
              key={row.user_id}
              userId={row.user_id}
              rank={row.rank}
              displayName={row.display_name}
              avatarUrl={row.avatar_url}
              points={
                'projected_points' in row
                  ? row.projected_points
                  : (row as { total_points: number }).total_points
              }
              subPoints={'confirmed_points' in row ? row.confirmed_points : undefined}
              exactCount={
                'exact_count' in row ? (row as { exact_count: number }).exact_count : undefined
              }
              isCurrentUser={row.user_id === user?.id}
              showSub={activeTab === 'projected' && hasLiveMatches}
              expandable={activeTab === 'projected' && hasLiveMatches}
            />
          ))
        )}
      </div>

      {/* Stats panel — only show when viewing full leaderboard (no jornada filter) */}
      {!roundFilter && (
        <GroupStatsPanel
          groupId={groupId}
          confirmedRows={confirmed.data ?? []}
          currentUserId={user?.id}
        />
      )}
    </div>
  )
}
