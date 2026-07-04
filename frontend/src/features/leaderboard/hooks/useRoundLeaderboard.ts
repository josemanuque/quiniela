import { useQuery } from '@tanstack/react-query'
import { leaderboardService, type LeaderboardRound } from '../services/leaderboardService'

export function useRoundLeaderboard(round: LeaderboardRound | null, groupId?: string) {
  return useQuery({
    queryKey: ['leaderboard', 'round', round, groupId ?? 'global'],
    queryFn: () => leaderboardService.getRoundLeaderboard(round as LeaderboardRound, groupId),
    enabled: round !== null,
    staleTime: 60_000,
  })
}
