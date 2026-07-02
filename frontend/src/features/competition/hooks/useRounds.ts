import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { competitionService } from '../services/competitionService'

export function useRounds(competitionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rounds(competitionId ?? ''),
    queryFn: () => competitionService.getRoundsByCompetition(competitionId ?? ''),
    enabled: !!competitionId,
    staleTime: 5 * 60_000,
  })
}
