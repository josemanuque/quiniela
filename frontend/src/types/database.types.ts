// Hand-authored mirror of the Supabase schema.
// Replace with `supabase gen types typescript` output once a project is linked.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      competitions: {
        Row: {
          id: string
          name: string
          slug: string
          season: number
          status: Database['public']['Enums']['competition_status']
          external_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          season: number
          status?: Database['public']['Enums']['competition_status']
          external_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          season?: number
          status?: Database['public']['Enums']['competition_status']
          external_id?: string | null
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          short_name: string
          flag_url: string | null
          external_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name: string
          flag_url?: string | null
          external_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string
          flag_url?: string | null
          external_id?: string | null
          updated_at?: string
        }
      }
      rounds: {
        Row: {
          id: string
          competition_id: string
          name: string
          phase: Database['public']['Enums']['round_phase']
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          name: string
          phase: Database['public']['Enums']['round_phase']
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          name?: string
          phase?: Database['public']['Enums']['round_phase']
          order_index?: number
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          competition_id: string
          round_id: string
          home_team_id: string
          away_team_id: string
          home_score: number | null
          away_score: number | null
          kickoff_at: string
          status: Database['public']['Enums']['match_status']
          external_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          round_id: string
          home_team_id: string
          away_team_id: string
          home_score?: number | null
          away_score?: number | null
          kickoff_at: string
          status?: Database['public']['Enums']['match_status']
          external_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          round_id?: string
          home_team_id?: string
          away_team_id?: string
          home_score?: number | null
          away_score?: number | null
          kickoff_at?: string
          status?: Database['public']['Enums']['match_status']
          external_id?: string | null
          updated_at?: string
        }
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          match_id: string
          home_score: number
          away_score: number
          points_earned: number | null
          locked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          home_score: number
          away_score: number
          points_earned?: number | null
          locked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          home_score?: number
          away_score?: number
          points_earned?: number | null
          locked_at?: string | null
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          competition_id: string
          owner_id: string
          name: string
          invite_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          owner_id: string
          name: string
          invite_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          updated_at?: string
        }
      }
      leaderboard_entries: {
        Row: {
          id: string
          group_id: string
          user_id: string
          competition_id: string
          total_points: number
          rank: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          competition_id: string
          total_points?: number
          rank?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          total_points?: number
          rank?: number
          updated_at?: string
        }
      }
      scoring_configurations: {
        Row: {
          id: string
          competition_id: string
          phase: Database['public']['Enums']['round_phase']
          exact_score_points: number
          correct_result_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          phase: Database['public']['Enums']['round_phase']
          exact_score_points: number
          correct_result_points: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exact_score_points?: number
          correct_result_points?: number
          updated_at?: string
        }
      }
    }
    Enums: {
      competition_status: 'upcoming' | 'active' | 'completed'
      match_status: 'upcoming' | 'live' | 'completed'
      round_phase: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
    }
    Functions: Record<string, never>
  }
}

// Convenience helpers — mirrors what `supabase gen types` exports
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
