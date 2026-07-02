import { supabase } from '@/lib/supabaseClient'
import type { Prediction, PredictionWithProfile } from '@/types/domain.types'

export const predictionService = {
  async upsertPrediction(
    matchId: string,
    homeScore: number,
    awayScore: number
  ): Promise<Prediction> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('predictions')
      .upsert(
        { user_id: user.id, match_id: matchId, home_score: homeScore, away_score: awayScore },
        { onConflict: 'user_id,match_id' }
      )
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getMyPrediction(matchId: string): Promise<Prediction | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async getMatchPredictions(matchId: string): Promise<PredictionWithProfile[]> {
    const { data: preds, error: predErr } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)
      .order('points_earned', { ascending: false, nullsFirst: false })

    if (predErr) throw predErr
    if (preds.length === 0) return []

    const userIds = [...new Set(preds.map((p) => p.user_id))]
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    if (profileErr) throw profileErr

    const profileMap = new Map(profiles.map((p) => [p.id, p]))

    return preds.map((p) => ({
      ...p,
      profile: profileMap.get(p.user_id) ?? { display_name: 'Unknown', avatar_url: null },
    }))
  },
}
