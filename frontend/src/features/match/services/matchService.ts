import { supabase } from '@/lib/supabaseClient'
import type { MatchWithTeams } from '@/types/domain.types'

const MATCH_SELECT = `
  *,
  home_team:teams!home_team_id(*),
  away_team:teams!away_team_id(*),
  round:rounds!round_id(*)
` as const

export const matchService = {
  async getMatchesByRound(roundId: string): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .eq('round_id', roundId)
      .order('kickoff_at', { ascending: true })

    if (error) throw error
    return data
  },

  async getMatch(matchId: string): Promise<MatchWithTeams> {
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .eq('id', matchId)
      .single()

    if (error) throw error
    return data
  },

  async getMatchesNow(competitionId: string): Promise<MatchWithTeams[]> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)

    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .eq('competition_id', competitionId)
      .or(
        `status.eq.live,and(kickoff_at.gte.${todayStart.toISOString()},kickoff_at.lt.${tomorrowStart.toISOString()})`
      )
      .order('kickoff_at', { ascending: true })

    if (error) throw error
    return data
  },

  async getMatchesByCompetition(competitionId: string): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .eq('competition_id', competitionId)
      .order('kickoff_at', { ascending: true })

    if (error) throw error
    return data
  },
}
