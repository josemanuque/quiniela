import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { matchService } from '../services/matchService'

export function useMatchesByMatchday(
  competitionId: string | undefined,
  matchday: 1 | 2 | 3 | undefined
) {
  return useQuery({
    queryKey: queryKeys.matchday(competitionId ?? '', matchday ?? 0),
    queryFn: () => {
      if (!competitionId || !matchday) throw new Error('Missing params')
      return matchService.getGroupStageMatchesByMatchday(competitionId, matchday)
    },
    enabled: !!competitionId && !!matchday,
  })
}
