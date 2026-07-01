import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { predictionService } from '../services/predictionService'

export function useSavePrediction(matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ homeScore, awayScore }: { homeScore: number; awayScore: number }) =>
      predictionService.upsertPrediction(matchId, homeScore, awayScore),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.myPrediction(matchId), data)
    },
  })
}
