import { useTranslation } from 'react-i18next'
import type { PredictionTier } from '@/types/domain.types'

export const TIER_LABELS: Record<PredictionTier, string> = {
  exact: 'Exact',
  partial_correct_winner: 'Partial + Win',
  correct_winner: 'Correct Winner',
  partial_wrong: 'Partial + Loss',
  miss: 'Miss',
}

// Shorter labels for space-constrained contexts (match card badge, etc.)
export const TIER_LABELS_SHORT: Record<PredictionTier, string> = {
  exact: 'Exact',
  partial_correct_winner: 'P+Win',
  correct_winner: 'Winner',
  partial_wrong: 'P+Loss',
  miss: 'Miss',
}

// Distinct 5-color palette: gold / lime-green / blue / violet / red
// Note: emerald is reserved for LIVE / active UI chrome — do NOT use it for tiers.
export const TIER_TEXT_CLASSES: Record<PredictionTier, string> = {
  exact: 'text-amber-400',
  partial_correct_winner: 'text-green-400',
  correct_winner: 'text-blue-400',
  partial_wrong: 'text-violet-400',
  miss: 'text-red-500',
}

export const TIER_BADGE_CLASSES: Record<PredictionTier, string> = {
  exact: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  partial_correct_winner: 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30',
  correct_winner: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  partial_wrong: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
  miss: 'bg-red-900/20 text-red-500 ring-1 ring-red-700/30',
}

export const TIER_BORDER_CLASSES: Record<PredictionTier, string> = {
  exact: 'border-l-amber-500',
  partial_correct_winner: 'border-l-green-500',
  correct_winner: 'border-l-blue-500',
  partial_wrong: 'border-l-violet-500',
  miss: 'border-l-red-700',
}

// For expandable breakdown rows (left border + tinted background)
export const TIER_ROW_CLASSES: Record<PredictionTier, string> = {
  exact: 'border-l-2 border-amber-500/50 bg-amber-500/5',
  partial_correct_winner: 'border-l-2 border-green-500/50 bg-green-500/5',
  correct_winner: 'border-l-2 border-blue-500/50 bg-blue-500/5',
  partial_wrong: 'border-l-2 border-violet-500/50 bg-violet-500/5',
  miss: 'border-l-2 border-red-700/50 bg-red-900/10',
}

export function useTierLabels(): Record<PredictionTier, string> {
  const { t } = useTranslation()
  return {
    exact: t('tier.exact'),
    partial_correct_winner: t('tier.partial_correct_winner'),
    correct_winner: t('tier.correct_winner'),
    partial_wrong: t('tier.partial_wrong'),
    miss: t('tier.miss'),
  }
}

export function computeLiveTier(
  pred: { home_score: number; away_score: number },
  live: { home_score: number; away_score: number }
): PredictionTier {
  if (pred.home_score === live.home_score && pred.away_score === live.away_score) return 'exact'
  const predResult = Math.sign(pred.home_score - pred.away_score)
  const liveResult = Math.sign(live.home_score - live.away_score)
  const sameScore = pred.home_score === live.home_score || pred.away_score === live.away_score
  if (sameScore && predResult === liveResult) return 'partial_correct_winner'
  if (predResult === liveResult) return 'correct_winner'
  if (sameScore) return 'partial_wrong'
  return 'miss'
}
