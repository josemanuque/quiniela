import type { PredictionTier } from '@/types/domain.types'

export const TIER_LABELS: Record<PredictionTier, string> = {
  exact:                   'Exact',
  partial_correct_winner:  'P+Win',
  correct_winner:          'Winner',
  partial_wrong:           'P+Loss',
  miss:                    'Miss',
}

export const TIER_TEXT_CLASSES: Record<PredictionTier, string> = {
  exact:                   'text-amber-400',
  partial_correct_winner:  'text-emerald-400',
  correct_winner:          'text-sky-400',
  partial_wrong:           'text-orange-400',
  miss:                    'text-zinc-500',
}

export const TIER_BADGE_CLASSES: Record<PredictionTier, string> = {
  exact:                   'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  partial_correct_winner:  'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  correct_winner:          'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
  partial_wrong:           'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30',
  miss:                    'bg-zinc-800 text-zinc-500',
}

export const TIER_BORDER_CLASSES: Record<PredictionTier, string> = {
  exact:                   'border-l-amber-500',
  partial_correct_winner:  'border-l-emerald-500',
  correct_winner:          'border-l-sky-500',
  partial_wrong:           'border-l-orange-400',
  miss:                    'border-l-zinc-700',
}

export function computeLiveTier(
  pred: { home_score: number; away_score: number },
  live: { home_score: number; away_score: number },
): PredictionTier {
  if (pred.home_score === live.home_score && pred.away_score === live.away_score) return 'exact'
  const predResult = Math.sign(pred.home_score - pred.away_score)
  const liveResult = Math.sign(live.home_score - live.away_score)
  const sameScore  = pred.home_score === live.home_score || pred.away_score === live.away_score
  if (sameScore && predResult === liveResult) return 'partial_correct_winner'
  if (predResult === liveResult)              return 'correct_winner'
  if (sameScore)                             return 'partial_wrong'
  return 'miss'
}
