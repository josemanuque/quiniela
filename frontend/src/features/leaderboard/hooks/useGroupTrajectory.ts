import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { leaderboardService, type Granularity } from '../services/leaderboardService'

export type { Granularity }

export function useGroupTrajectory(groupId: string | undefined, granularity: Granularity) {
  return useQuery({
    queryKey: queryKeys.groupTrajectory(groupId ?? '', granularity),
    queryFn: () => leaderboardService.getGroupPointsTrajectory(groupId!, granularity),
    enabled: !!groupId,
    staleTime: 60_000,
  })
}
