import { supabase } from '@/lib/supabaseClient'
import type { Competition, Round, ScoringConfiguration } from '@/types/domain.types'

export const competitionService = {
  async getActiveCompetition(): Promise<Competition> {
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .in('status', ['active', 'upcoming'])
      .order('status', { ascending: true }) // 'active' sorts before 'upcoming'
      .limit(1)
      .single()

    if (error) throw error
    return data
  },

  async getRoundsByCompetition(competitionId: string): Promise<Round[]> {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('competition_id', competitionId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data
  },

  async getScoringConfig(competitionId: string): Promise<ScoringConfiguration[]> {
    const { data, error } = await supabase
      .from('scoring_configurations')
      .select('*')
      .eq('competition_id', competitionId)

    if (error) throw error
    return data
  },
}
