import { supabase } from '@/lib/supabaseClient'

export interface GlobalLeaderboardRow {
  user_id: string
  display_name: string
  avatar_url: string | null
  total_points: number
  exact_count: number
  rank: number
}

export interface ProjectedLeaderboardRow {
  user_id: string
  display_name: string
  avatar_url: string | null
  confirmed_points: number
  projected_points: number
  exact_count: number
  rank: number
}

export type BreakdownTier =
  'exact' | 'partial_correct' | 'correct_winner' | 'partial_wrong' | 'miss'

export interface LiveBreakdownRow {
  match_id: string
  home_team_name: string
  away_team_name: string
  home_team_flag: string | null
  away_team_flag: string | null
  live_home_score: number
  live_away_score: number
  pred_home_score: number
  pred_away_score: number
  provisional_pts: number
  tier: BreakdownTier
}

export type Granularity = 'round' | 'day' | 'match'

export interface TrajectoryRow {
  user_id: string
  display_name: string
  avatar_url: string | null
  x_sort: string
  x_label: string
  period_points: number
  cumulative_points: number
}

export const leaderboardService = {
  async getGlobalLeaderboard(): Promise<GlobalLeaderboardRow[]> {
    const { data, error } = await supabase.rpc('get_global_leaderboard')
    if (error) throw error
    return data
  },

  async getProjectedLeaderboard(): Promise<ProjectedLeaderboardRow[]> {
    const { data, error } = await supabase.rpc('get_projected_leaderboard')
    if (error) throw error
    return data
  },

  async getGroupLeaderboard(groupId: string): Promise<GlobalLeaderboardRow[]> {
    const { data, error } = await supabase.rpc('get_group_leaderboard', { p_group_id: groupId })
    if (error) throw error
    return data
  },

  async getGroupProjectedLeaderboard(groupId: string): Promise<ProjectedLeaderboardRow[]> {
    const { data, error } = await supabase.rpc('get_group_projected_leaderboard', {
      p_group_id: groupId,
    })
    if (error) throw error
    return data
  },

  async getUserLiveBreakdown(userId: string): Promise<LiveBreakdownRow[]> {
    const { data, error } = await supabase.rpc('get_user_live_breakdown', { p_user_id: userId })
    if (error) throw error
    return data as LiveBreakdownRow[]
  },

  async getGroupPointsTrajectory(
    groupId: string,
    granularity: Granularity
  ): Promise<TrajectoryRow[]> {
    const { data, error } = await supabase.rpc('get_group_points_trajectory', {
      p_group_id: groupId,
      p_granularity: granularity,
    })
    if (error) throw error
    return data
  },
}
