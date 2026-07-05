import { Info, Zap, ChevronRight, Target } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TIER_TEXT_CLASSES } from '@/features/prediction/utils/tierUtils'
import { useTierLabels } from '@/features/prediction/utils/tierUtils'
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

export function ScoringRulesPopover({ size = 16, align = 'end' }: Props) {
  const { t } = useTranslation()
  const tierLabels = useTierLabels()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0"
          aria-label={t('scoring.ariaLabel')}
        >
          <Info size={size} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-56 bg-zinc-900 border-zinc-700 p-3 shadow-xl"
        align={align}
        sideOffset={6}
      >
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">
          {t('scoring.title')}
        </p>

        <div className="space-y-1.5">
          {TIERS.map(({ tier, groupPts }) => (
            <div key={tier} className="flex items-center justify-between gap-2">
              <span className={cn('text-xs', TIER_TEXT_CLASSES[tier])}>{tierLabels[tier]}</span>
              <span className={cn('text-xs font-semibold tabular-nums', TIER_TEXT_CLASSES[tier])}>
                {groupPts > 0 ? `+${groupPts.toString()}` : '—'}
              </span>
            </div>
          ))}
        </div>

        {/* ×2 knockout multiplier */}
        <div className="mt-2.5 pt-2 border-t border-zinc-700/60 flex items-center gap-1.5">
          <Zap size={11} className="text-amber-400 flex-shrink-0" />
          <p className="text-[10px] text-zinc-500">{t('scoring.x2Note')}</p>
        </div>

        {/* Penalty bonus */}
        <div className="mt-2 pt-2 border-t border-zinc-700/60">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target size={11} className="text-amber-400 flex-shrink-0" />
            <p className="text-[10px] text-zinc-400 font-medium">{t('scoring.penBonus')}</p>
          </div>
          <div className="space-y-1 ml-[15px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">{t('scoring.penWinner')}</span>
              <span className="text-[10px] font-semibold text-amber-400 tabular-nums">+1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">{t('scoring.penExact')}</span>
              <span className="text-[10px] font-semibold text-amber-400 tabular-nums">+2</span>
            </div>
          </div>
        </div>

        <Link
          to="/app/rules"
          className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors pt-2 border-t border-zinc-700/60"
        >
          {t('scoring.fullRules')}
          <ChevronRight size={12} />
        </Link>
      </PopoverContent>
    </Popover>
  )
}
