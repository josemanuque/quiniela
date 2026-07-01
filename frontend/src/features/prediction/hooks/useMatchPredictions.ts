import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { predictionService } from '../services/predictionService'

export function useMatchPredictions(matchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.predictions(matchId ?? ''),
    queryFn:  () => predictionService.getMatchPredictions(matchId!),
    enabled:  !!matchId,
  })
}
