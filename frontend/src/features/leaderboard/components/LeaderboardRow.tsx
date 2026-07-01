import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Props {
  rank:        number
  displayName: string
  avatarUrl:   string | null
  points:      number
  subPoints?:  number   // confirmed points when showing projected
  isCurrentUser: boolean
  showSub?: boolean
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
  rank,
  displayName,
  avatarUrl,
  points,
  subPoints,
  isCurrentUser,
  showSub,
}: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
        isCurrentUser
          ? 'bg-emerald-950/50 ring-1 ring-emerald-800/60'
          : 'bg-zinc-900',
      )}
    >
      {/* Rank */}
      <span
        className={cn(
          'w-6 text-center text-sm tabular-nums flex-shrink-0',
          RANK_STYLES[rank] ?? 'text-zinc-500',
        )}
      >
        {rank}
      </span>

      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
          {initials(displayName)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <span className={cn('flex-1 text-sm truncate', isCurrentUser ? 'text-white font-medium' : 'text-zinc-200')}>
        {displayName}
        {isCurrentUser && <span className="ml-1.5 text-[10px] text-zinc-500">(you)</span>}
      </span>

      {/* Points */}
      <div className="text-right flex-shrink-0">
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            isCurrentUser ? 'text-emerald-400' : 'text-white',
          )}
        >
          {points}
        </span>
        {showSub && subPoints !== undefined && subPoints !== points && (
          <div className="text-[10px] text-zinc-600 tabular-nums">
            {subPoints} conf.
          </div>
        )}
      </div>
    </div>
  )
}
