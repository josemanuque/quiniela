import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { competitionService } from '../services/competitionService'
import type { PredictionTier, RoundPhase, ScoringConfiguration } from '@/types/domain.types'

export function useScoringConfig(competitionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.scoringConfig(competitionId ?? ''),
    queryFn: () => competitionService.getScoringConfig(competitionId!),
    enabled: !!competitionId,
    staleTime: 1000 * 60 * 60,
  })
}

export function getScoringForPhase(
  configs: ScoringConfiguration[],
  phase: RoundPhase,
): ScoringConfiguration | undefined {
  return configs.find(c => c.phase === phase)
}

export function tierToPoints(tier: PredictionTier, config: ScoringConfiguration): number {
  const m = config.phase_multiplier ?? 1
  switch (tier) {
    case 'exact':                  return config.exact_score_points * m
    case 'partial_correct_winner': return config.partial_correct_winner_points * m
    case 'correct_winner':         return config.correct_result_points * m
    case 'partial_wrong':          return config.partial_wrong_winner_points * m
    case 'miss':                   return 0
  }
}
