import { useRef, useEffect } from 'react'
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

  // Convert vertical mouse-wheel scroll to horizontal on desktop.
  // Must be non-passive so we can call preventDefault().
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return // already horizontal
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div className="relative border-b border-zinc-800">
      {/* Right-edge fade — pointer-events-none so pills stay clickable */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-zinc-950 to-transparent z-10" />

    <div
      ref={listRef}
      className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-3"
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
    </div>
  )
}
