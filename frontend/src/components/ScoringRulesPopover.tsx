import { Info, Zap, ChevronRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TIER_TEXT_CLASSES, TIER_LABELS } from '@/features/prediction/utils/tierUtils'
import type { PredictionTier } from '@/types/domain.types'

const TIERS: { tier: PredictionTier; groupPts: number }[] = [
  { tier: 'exact', groupPts: 5 },
  { tier: 'partial_correct_winner', groupPts: 3 },
  { tier: 'correct_winner', groupPts: 2 },
  { tier: 'partial_wrong', groupPts: 1 },
  { tier: 'miss', groupPts: 0 },
]

interface Props {
  size?: number
  align?: 'start' | 'center' | 'end'
}

export function ScoringRulesPopover({ size = 14, align = 'end' }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* stopPropagation prevents click bubbling when inside clickable cards */}
        <button
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0"
          aria-label="Scoring rules"
        >
          <Info size={size} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-52 bg-zinc-900 border-zinc-700 p-3 shadow-xl"
        align={align}
        sideOffset={6}
      >
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">
          Scoring Rules
        </p>

        <div className="space-y-1.5">
          {TIERS.map(({ tier, groupPts }) => (
            <div key={tier} className="flex items-center justify-between gap-2">
              <span className={cn('text-xs', TIER_TEXT_CLASSES[tier])}>{TIER_LABELS[tier]}</span>
              <span className={cn('text-xs font-semibold tabular-nums', TIER_TEXT_CLASSES[tier])}>
                {groupPts > 0 ? `+${groupPts.toString()}` : '—'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2.5 pt-2 border-t border-zinc-700/60 flex items-center gap-1.5">
          <Zap size={11} className="text-amber-400 flex-shrink-0" />
          <p className="text-[10px] text-zinc-500">×2 points in knockout rounds</p>
        </div>

        <Link
          to="/app/rules"
          className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors pt-2 border-t border-zinc-700/60"
        >
          Full scoring rules
          <ChevronRight size={12} />
        </Link>
      </PopoverContent>
    </Popover>
  )
}
