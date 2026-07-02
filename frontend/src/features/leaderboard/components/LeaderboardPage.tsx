import { useState } from 'react'
import { Trophy, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMyGroups } from '@/features/group/hooks/useMyGroups'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { LeaderboardRow } from './LeaderboardRow'
import { GroupStatsPanel } from './GroupStatsPanel'

type Tab = 'projected' | 'confirmed'

export function LeaderboardPage() {
  const { user } = useAuth()
  const { data: myGroups } = useMyGroups()

  const [scope, setScope] = useState<string>('global')
  const [tab, setTab] = useState<Tab>('projected')

  const groupId = scope === 'global' ? undefined : scope
  const activeGroup = myGroups?.find((g) => g.id === groupId)
  const { confirmed, projected, hasLiveMatches } = useLeaderboard(groupId)

  const activeTab = hasLiveMatches ? tab : 'confirmed'
  const rows =
    activeTab === 'projected'
      ? (projected.data ?? [])
      : (confirmed.data?.map((r) => ({
          ...r,
          projected_points: 'total_points' in r ? r.total_points : 0,
          confirmed_points: 'total_points' in r ? r.total_points : 0,
        })) ?? [])

  const isLoading = activeTab === 'projected' ? projected.isLoading : confirmed.isLoading
  const hasGroups = myGroups && myGroups.length > 0

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 min-h-full pb-14">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-white font-semibold text-base">Leaderboard</h1>
      </div>

      {/* Scope selector — Global + one chip per group */}
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
              Global
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

      {/* Projected / Confirmed tab switcher — only when live matches exist */}
      {hasLiveMatches && (
        <div className="flex items-center gap-2 px-4 mt-3 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-1.5 bg-zinc-900 rounded-full p-0.5 flex-1">
            {(['projected', 'confirmed'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
                }}
                className={cn(
                  'flex-1 py-1.5 rounded-full text-xs font-medium transition-colors',
                  activeTab === t
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-300'
                )}
              >
                {t === 'projected' ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Projected
                  </span>
                ) : (
                  'Confirmed'
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Column headers */}
      {!isLoading && rows.length > 0 && (
        <div className="flex items-center gap-3 px-8 pt-3 pb-1 max-w-2xl mx-auto w-full">
          <span className="w-6" />
          <span className="w-8" />
          <span className="flex-1 text-[10px] text-zinc-600 uppercase tracking-wider font-medium">
            Player
          </span>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium w-9 text-right">
            Exact
          </span>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium w-8 text-right">
            Pts
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
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="bg-zinc-800 rounded-full p-5">
              <Trophy size={28} className="text-zinc-500" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">No rankings yet</p>
              <p className="text-zinc-500 text-sm mt-1">
                {scope === 'global'
                  ? 'Make predictions to appear on the leaderboard'
                  : 'Group members need predictions on completed matches'}
              </p>
            </div>
          </div>
        ) : (
          rows.map((row) => (
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

      {/* Group stats — trajectory + exact count charts */}
      {groupId && activeGroup && (
        <GroupStatsPanel
          groupId={groupId}
          confirmedRows={confirmed.data ?? []}
          currentUserId={user?.id}
        />
      )}
    </div>
  )
}
