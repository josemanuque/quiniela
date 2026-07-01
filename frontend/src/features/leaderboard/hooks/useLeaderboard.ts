import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { queryKeys } from '@/lib/queryKeys'
import { leaderboardService } from '../services/leaderboardService'

export function useLeaderboard() {
  const queryClient = useQueryClient()

  const confirmed = useQuery({
    queryKey: queryKeys.leaderboard('confirmed'),
    queryFn:  leaderboardService.getGlobalLeaderboard,
  })

  const projected = useQuery({
    queryKey: queryKeys.leaderboard('projected'),
    queryFn:  leaderboardService.getProjectedLeaderboard,
  })

  // Refresh projected when any live match score updates
  // Refresh confirmed when a prediction gets scored (points_earned set)
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        () => queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard('projected') }),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'predictions' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard('confirmed') })
          queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard('projected') })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  const hasLiveMatches =
    projected.data?.some(r => r.projected_points > r.confirmed_points) ?? false

  return { confirmed, projected, hasLiveMatches }
}
