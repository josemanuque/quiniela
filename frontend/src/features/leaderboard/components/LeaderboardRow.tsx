import { useState } from 'react'
import { ChevronDown, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LeaderboardBreakdown } from './LeaderboardBreakdown'

interface Props {
  userId:        string
  rank:          number
  displayName:   string
  avatarUrl:     string | null
  points:        number
  subPoints?:    number
  exactCount?:   number
  isCurrentUser: boolean
  showSub?:      boolean
  expandable?:   boolean
}

const RANK_STYLES: Record<number, string> = {
  1: 'text-yellow-400 font-bold',
  2: 'text-zinc-300 font-bold',
  3: 'text-amber-600 font-bold',
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function LeaderboardRow({
  userId,
  rank,
  displayName,
  avatarUrl,
  points,
  subPoints,
  exactCount,
  isCurrentUser,
  showSub,
  expandable,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden transition-colors',
        isCurrentUser ? 'bg-emerald-950/50 ring-1 ring-emerald-800/60' : 'bg-zinc-900',
      )}
    >
      {/* Main row */}
      <div
        role={expandable ? 'button' : undefined}
        tabIndex={expandable ? 0 : undefined}
        onClick={expandable ? () => setExpanded(v => !v) : undefined}
        onKeyDown={expandable ? e => e.key === 'Enter' && setExpanded(v => !v) : undefined}
        className={cn(
          'flex items-center gap-3 px-4 py-3',
          expandable && 'cursor-pointer select-none',
        )}
      >
        {/* Rank */}
        <span className={cn('w-6 text-center text-sm tabular-nums flex-shrink-0', RANK_STYLES[rank] ?? 'text-zinc-500')}>
          {rank}
        </span>

        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatarUrl ?? undefined} alt={displayName} referrerPolicy="no-referrer" />
          <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
            {initials(displayName)}
          </AvatarFallback>
        </Avatar>

        {/* Name */}
        <span className={cn('flex-1 text-sm truncate', isCurrentUser ? 'text-white font-medium' : 'text-zinc-200')}>
          {displayName}
          {isCurrentUser && <span className="ml-1.5 text-[10px] text-zinc-500">(you)</span>}
        </span>

        {/* Exact count */}
        {exactCount !== undefined && (
          <div className="flex items-center gap-0.5 flex-shrink-0 w-9 justify-end">
            <Star
              size={11}
              className={exactCount > 0 ? 'text-amber-400 fill-amber-400' : 'text-zinc-700 fill-zinc-700'}
            />
            <span className={cn('text-xs tabular-nums', exactCount > 0 ? 'text-zinc-400' : 'text-zinc-700')}>
              {exactCount}
            </span>
          </div>
        )}

        {/* Points + expand chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <span className={cn('text-sm font-semibold tabular-nums', isCurrentUser ? 'text-emerald-400' : 'text-white')}>
              {points}
            </span>
            {showSub && subPoints !== undefined && subPoints !== points && (
              <div className="text-[10px] text-zinc-600 tabular-nums">{subPoints} conf.</div>
            )}
          </div>
          {expandable && (
            <ChevronDown
              size={14}
              className={cn('text-zinc-600 transition-transform', expanded && 'rotate-180')}
            />
          )}
        </div>
      </div>

      {/* Breakdown panel */}
      {expandable && expanded && (
        <div className="px-4 pb-3">
          <LeaderboardBreakdown userId={userId} />
        </div>
      )}
    </div>
  )
}
