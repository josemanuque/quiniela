import { useRef } from 'react'
import { cn } from '@/lib/utils'
import type { Round } from '@/types/domain.types'
import { getRoundTabLabel } from '../utils/roundUtils'

interface RoundTabsProps {
  rounds: Round[]
  selectedRoundId: string | undefined
  onSelect: (roundId: string) => void
}

export function RoundTabs({ rounds, selectedRoundId, onSelect }: RoundTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll the active pill into view when it changes
  function handleSelect(roundId: string) {
    onSelect(roundId)
  }

  return (
    <div
      ref={listRef}
      className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-3 border-b border-zinc-800"
      role="tablist"
      aria-label="Tournament rounds"
    >
      {rounds.map(round => {
        const isActive = round.id === selectedRoundId
        const label = getRoundTabLabel(round.phase, round.name)

        return (
          <button
            key={round.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(round.id)}
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
