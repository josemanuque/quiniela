import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { predictionService } from '../services/predictionService'

export function useSavePrediction(matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      homeScore,
      awayScore,
      penaltyHomeScore = null,
      penaltyAwayScore = null,
    }: {
      homeScore: number
      awayScore: number
      penaltyHomeScore?: number | null
      penaltyAwayScore?: number | null
    }) =>
      predictionService.upsertPrediction(
        matchId,
        homeScore,
        awayScore,
        penaltyHomeScore,
        penaltyAwayScore
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.myPrediction(matchId), data)
    },
  })
}
