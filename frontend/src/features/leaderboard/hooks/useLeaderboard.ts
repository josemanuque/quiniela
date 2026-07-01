import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { queryKeys } from '@/lib/queryKeys'
import { leaderboardService } from '../services/leaderboardService'

// groupId=undefined → global leaderboard
// groupId=<uuid>   → group-scoped leaderboard
export function useLeaderboard(groupId?: string) {
  const queryClient = useQueryClient()
  const scope = groupId ?? 'global'

  const confirmed = useQuery({
    queryKey: queryKeys.leaderboard(scope, 'confirmed'),
    queryFn: groupId
      ? () => leaderboardService.getGroupLeaderboard(groupId)
      : leaderboardService.getGlobalLeaderboard,
  })

  const projected = useQuery({
    queryKey: queryKeys.leaderboard(scope, 'projected'),
    queryFn: groupId
      ? () => leaderboardService.getGroupProjectedLeaderboard(groupId)
      : leaderboardService.getProjectedLeaderboard,
  })

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
      .channel(`leaderboard-realtime-${scope}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
        void queryClient.invalidateQueries({ queryKey: ['live-matches-count'] })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'predictions' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [queryClient, scope])

  const hasLiveMatches = (liveCount.data ?? 0) > 0

  return { confirmed, projected, hasLiveMatches }
}
