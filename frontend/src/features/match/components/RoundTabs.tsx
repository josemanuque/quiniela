import { useRef } from 'react'
import { cn } from '@/lib/utils'
import type { Round } from '@/types/domain.types'
import { getRoundTabLabel } from '../utils/roundUtils'
import { NOW_ROUND_ID } from '../hooks/useNowMatches'

interface RoundTabsProps {
  rounds:          Round[]
  selectedRoundId: string | undefined
  onSelect:        (roundId: string) => void
}

export function RoundTabs({ rounds, selectedRoundId, onSelect }: RoundTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={listRef}
      className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-3 border-b border-zinc-800"
      role="tablist"
      aria-label="Tournament rounds"
    >
      {/* Smart "Now" tab — always first */}
      <button
        role="tab"
        aria-selected={selectedRoundId === NOW_ROUND_ID}
        onClick={() => onSelect(NOW_ROUND_ID)}
        className={cn(
          'flex-shrink-0 h-8 px-3.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex items-center gap-1.5',
          selectedRoundId === NOW_ROUND_ID
            ? 'bg-emerald-500 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
        Now
      </button>

      {rounds.map(round => {
        const isActive = round.id === selectedRoundId
        const label    = getRoundTabLabel(round.phase, round.name)

        return (
          <button
            key={round.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(round.id)}
            className={cn(
              'flex-shrink-0 h-8 px-3.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              isActive
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
