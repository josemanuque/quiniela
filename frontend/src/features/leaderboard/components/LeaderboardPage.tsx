import { useState } from 'react'
import { Trophy, HelpCircle } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMyGroups } from '@/features/group/hooks/useMyGroups'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { LeaderboardRow } from './LeaderboardRow'

type Tab = 'projected' | 'confirmed'

export function LeaderboardPage() {
  const { user } = useAuth()
  const { data: myGroups } = useMyGroups()

  const [scope, setScope] = useState<string>('global')
  const [tab, setTab]     = useState<Tab>('projected')

  const groupId = scope === 'global' ? undefined : scope
  const { confirmed, projected, hasLiveMatches } = useLeaderboard(groupId)

  const activeTab = hasLiveMatches ? tab : 'confirmed'
  const rows =
    activeTab === 'projected'
      ? projected.data ?? []
      : confirmed.data?.map(r => ({
          ...r,
          projected_points: 'total_points' in r ? r.total_points : 0,
          confirmed_points: 'total_points' in r ? r.total_points : 0,
        })) ?? []

  const isLoading = activeTab === 'projected' ? projected.isLoading : confirmed.isLoading
  const hasGroups = myGroups && myGroups.length > 0

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 min-h-full pb-14">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-white font-semibold text-base">Leaderboard</h1>
        <Link to="/app/rules" className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5">
          <HelpCircle size={18} />
        </Link>
      </div>

      {/* Scope selector — Global + one chip per group */}
      {hasGroups && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2.5 border-b border-zinc-800">
          <button
            onClick={() => setScope('global')}
            className={cn(
              'flex-shrink-0 h-8 px-3.5 rounded-full text-sm font-medium transition-colors',
              scope === 'global'
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
            )}
          >
            Global
          </button>
          {myGroups.map(group => (
            <button
              key={group.id}
              onClick={() => setScope(group.id)}
              className={cn(
                'flex-shrink-0 h-8 px-3.5 rounded-full text-sm font-medium transition-colors',
                scope === group.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
              )}
            >
              {group.name}
            </button>
          ))}
        </div>
      )}

      {/* Projected / Confirmed tab switcher — only when live matches exist */}
      {hasLiveMatches && (
        <div className="flex items-center gap-2 px-4 mt-3">
          <div className="flex items-center gap-1.5 bg-zinc-900 rounded-full p-0.5 flex-1">
            {(['projected', 'confirmed'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 py-1.5 rounded-full text-xs font-medium transition-colors',
                  activeTab === t
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-300',
                )}
              >
                {t === 'projected' ? '🔴 Projected' : 'Confirmed'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rows */}
      <div className="flex-1 px-4 py-3 space-y-1.5">
        {isLoading ? (
          <div className="space-y-1.5">
            {[1, 2, 3, 4, 5].map(i => (
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
          rows.map(row => (
            <LeaderboardRow
              key={row.user_id}
              userId={row.user_id}
              rank={Number(row.rank)}
              displayName={row.display_name}
              avatarUrl={row.avatar_url}
              points={
                'projected_points' in row
                  ? row.projected_points
                  : (row as { total_points: number }).total_points
              }
              subPoints={'confirmed_points' in row ? row.confirmed_points : undefined}
              exactCount={'exact_count' in row ? (row as { exact_count: number }).exact_count : undefined}
              isCurrentUser={row.user_id === user?.id}
              showSub={activeTab === 'projected' && hasLiveMatches}
              expandable={activeTab === 'projected' && hasLiveMatches}
            />
          ))
        )}
      </div>
    </div>
  )
}
