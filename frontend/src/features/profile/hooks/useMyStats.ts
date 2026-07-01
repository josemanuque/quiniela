import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/features/auth/hooks/useAuth'

export interface MyStats {
  total_points:        number
  global_rank:         number | null
  predictions_made:    number
  scored_predictions:  number
  correct_predictions: number
}

export function useMyStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['my-stats', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MyStats> => {
      const { data, error } = await supabase.rpc('get_my_profile_stats')
      if (error) throw error
      const row = (data as MyStats[])[0]
      return row ?? {
        total_points: 0,
        global_rank: null,
        predictions_made: 0,
        scored_predictions: 0,
        correct_predictions: 0,
      }
    },
    staleTime: 60_000,
  })
}
