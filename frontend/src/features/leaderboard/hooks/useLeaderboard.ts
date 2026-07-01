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

  // Direct count of live matches — drives the tab switcher independently of projected data
  const liveCount = useQuery({
    queryKey: ['live-matches-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'live')
      return count ?? 0
    },
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard('projected') })
          void queryClient.invalidateQueries({ queryKey: ['live-matches-count'] })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'predictions' },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard('confirmed') })
          void queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard('projected') })
        },
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [queryClient])

  const hasLiveMatches = (liveCount.data ?? 0) > 0

  return { confirmed, projected, hasLiveMatches }
}
