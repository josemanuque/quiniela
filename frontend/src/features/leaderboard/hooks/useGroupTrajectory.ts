import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { leaderboardService, type Granularity } from '../services/leaderboardService'

export type { Granularity }

// groupId is optional — omit for global jornada chart
export function useGroupTrajectory(groupId: string | undefined, granularity: Granularity) {
  return useQuery({
    queryKey: queryKeys.groupTrajectory(groupId ?? 'global', granularity),
    queryFn: () =>
      granularity === 'round'
        ? leaderboardService.getRoundTrajectory(groupId)
        : leaderboardService.getGroupPointsTrajectory(groupId ?? '', granularity),
    // 'round' granularity works globally; 'day'/'match' need a real groupId
    enabled: granularity === 'round' ? true : !!groupId,
    staleTime: 60_000,
  })
}
