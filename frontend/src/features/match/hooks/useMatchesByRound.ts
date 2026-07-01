import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { queryKeys } from '@/lib/queryKeys'
import { matchService } from '../services/matchService'
import type { MatchWithTeams } from '@/types/domain.types'

export function useMatchesByRound(roundId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.matches(roundId),
    queryFn:  () => matchService.getMatchesByRound(roundId!),
    enabled:  !!roundId,
  })

  // Subscribe to live score updates via Supabase Realtime.
  // On any UPDATE to a match in this round, merge the new values into the cache
  // without a full refetch so the card updates instantly.
  useEffect(() => {
    if (!roundId) return

    const channel = supabase
      .channel(`matches-round-${roundId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'matches',
          filter: `round_id=eq.${roundId}`,
        },
        (payload) => {
          queryClient.setQueryData<MatchWithTeams[]>(
            queryKeys.matches(roundId),
            (old) =>
              old?.map(m =>
                m.id === (payload.new as { id: string }).id
                  ? { ...m, ...(payload.new as Partial<MatchWithTeams>) }
                  : m,
              ) ?? old,
          )
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roundId, queryClient])

  return query
}
