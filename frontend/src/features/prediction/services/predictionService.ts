import { supabase } from '@/lib/supabaseClient'
import type { Prediction } from '@/types/domain.types'

export const predictionService = {
  async upsertPrediction(matchId: string, homeScore: number, awayScore: number): Promise<Prediction> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('predictions')
      .upsert(
        { user_id: user.id, match_id: matchId, home_score: homeScore, away_score: awayScore },
        { onConflict: 'user_id,match_id' },
      )
      .select()
      .single()

    if (error) throw error
    return data as Prediction
  },

  async getMyPrediction(matchId: string): Promise<Prediction | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    return data as Prediction | null
  },

  async getMatchPredictions(matchId: string): Promise<Prediction[]> {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)

    if (error) throw error
    return (data ?? []) as Prediction[]
  },
}
