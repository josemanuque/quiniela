import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { competitionService } from '../services/competitionService'

export function useActiveCompetition() {
  return useQuery({
    queryKey: queryKeys.activeCompetition(),
    queryFn:  () => competitionService.getActiveCompetition(),
    staleTime: 10 * 60_000,
  })
}
