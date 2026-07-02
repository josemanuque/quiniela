import { useQuery } from '@tanstack/react-query'
import { matchService } from '../services/matchService'

export const NOW_ROUND_ID = 'now'

export function useNowMatches(competitionId: string | undefined) {
  return useQuery({
    queryKey: ['matches', 'now', competitionId],
    queryFn: () => matchService.getMatchesNow(competitionId ?? ''),
    enabled: !!competitionId,
    refetchInterval: 30_000,
  })
}
