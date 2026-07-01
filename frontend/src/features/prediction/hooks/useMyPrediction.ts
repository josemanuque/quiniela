import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { predictionService } from '../services/predictionService'

export function useMyPrediction(matchId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.myPrediction(matchId),
    queryFn:  () => predictionService.getMyPrediction(matchId),
    enabled:  !!matchId && !!user,
  })
}
