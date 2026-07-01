import { supabase } from '@/lib/supabaseClient'

export interface GlobalLeaderboardRow {
  user_id:      string
  display_name: string
  avatar_url:   string | null
  total_points: number
  rank:         number
}

export interface ProjectedLeaderboardRow {
  user_id:          string
  display_name:     string
  avatar_url:       string | null
  confirmed_points: number
  projected_points: number
  rank:             number
}

export const leaderboardService = {
  async getGlobalLeaderboard(): Promise<GlobalLeaderboardRow[]> {
    const { data, error } = await supabase.rpc('get_global_leaderboard')
    if (error) throw error
    return (data ?? []) as GlobalLeaderboardRow[]
  },

  async getProjectedLeaderboard(): Promise<ProjectedLeaderboardRow[]> {
    const { data, error } = await supabase.rpc('get_projected_leaderboard')
    if (error) throw error
    return (data ?? []) as ProjectedLeaderboardRow[]
  },
}
