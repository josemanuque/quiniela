import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { matchService } from '../services/matchService'

export function useMatch(matchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.match(matchId ?? ''),
    queryFn: () => matchService.getMatch(matchId ?? ''),
    enabled: !!matchId,
  })
}
