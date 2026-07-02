export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      competitions: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          name: string
          season: number
          slug: string
          status: Database["public"]["Enums"]["competition_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          name: string
          season: number
          slug: string
          status?: Database["public"]["Enums"]["competition_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          name?: string
          season?: number
          slug?: string
          status?: Database["public"]["Enums"]["competition_status"]
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          joined_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          joined_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          joined_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          invite_code: string
          name: string
          owner_id: string
          stakes: string | null
          updated_at: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          invite_code: string
          name: string
          owner_id: string
          stakes?: string | null
          updated_at?: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
          stakes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          competition_id: string
          created_at: string
          group_id: string
          id: string
          rank: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          group_id: string
          id?: string
          rank?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          group_id?: string
          id?: string
          rank?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_penalties: number | null
          away_score: number | null
          away_team_id: string
          competition_id: string
          created_at: string
          external_id: string | null
          home_penalties: number | null
          home_score: number | null
          home_team_id: string
          id: string
          kickoff_at: string
          round_id: string
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
        }
        Insert: {
          away_penalties?: number | null
          away_score?: number | null
          away_team_id: string
          competition_id: string
          created_at?: string
          external_id?: string | null
          home_penalties?: number | null
          home_score?: number | null
          home_team_id: string
          id?: string
          kickoff_at: string
          round_id: string
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Update: {
          away_penalties?: number | null
          away_score?: number | null
          away_team_id?: string
          competition_id?: string
          created_at?: string
          external_id?: string | null
          home_penalties?: number | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          kickoff_at?: string
          round_id?: string
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          away_score: number
          created_at: string
          home_score: number
          id: string
          locked_at: string | null
          match_id: string
          points_earned: number | null
          tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          away_score: number
          created_at?: string
          home_score: number
          id?: string
          locked_at?: string | null
          match_id: string
          points_earned?: number | null
          tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          away_score?: number
          created_at?: string
          home_score?: number
          id?: string
          locked_at?: string | null
          match_id?: string
          points_earned?: number | null
          tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          name: string
          order_index: number
          phase: Database["public"]["Enums"]["round_phase"]
          updated_at: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          name: string
          order_index: number
          phase: Database["public"]["Enums"]["round_phase"]
          updated_at?: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          phase?: Database["public"]["Enums"]["round_phase"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_configurations: {
        Row: {
          competition_id: string
          correct_result_points: number
          created_at: string
          exact_score_points: number
          id: string
          partial_correct_winner_points: number
          partial_wrong_winner_points: number
          phase: Database["public"]["Enums"]["round_phase"]
          phase_multiplier: number
          updated_at: string
        }
        Insert: {
          competition_id: string
          correct_result_points: number
          created_at?: string
          exact_score_points: number
          id?: string
          partial_correct_winner_points?: number
          partial_wrong_winner_points?: number
          phase: Database["public"]["Enums"]["round_phase"]
          phase_multiplier?: number
          updated_at?: string
        }
        Update: {
          competition_id?: string
          correct_result_points?: number
          created_at?: string
          exact_score_points?: number
          id?: string
          partial_correct_winner_points?: number
          partial_wrong_winner_points?: number
          phase?: Database["public"]["Enums"]["round_phase"]
          phase_multiplier?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_configurations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          external_id: string | null
          flag_url: string | null
          id: string
          name: string
          short_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          flag_url?: string | null
          id?: string
          name: string
          short_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          flag_url?: string | null
          id?: string
          name?: string
          short_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_global_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          exact_count: number
          rank: number
          total_points: number
          user_id: string
        }[]
      }
      get_group_leaderboard: {
        Args: { p_group_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          exact_count: number
          rank: number
          total_points: number
          user_id: string
        }[]
      }
      get_group_projected_leaderboard: {
        Args: { p_group_id: string }
        Returns: {
          avatar_url: string
          confirmed_points: number
          display_name: string
          exact_count: number
          projected_points: number
          rank: number
          user_id: string
        }[]
      }
      get_my_profile_stats: {
        Args: never
        Returns: {
          correct_predictions: number
          global_rank: number
          predictions_made: number
          scored_predictions: number
          total_points: number
        }[]
      }
      get_projected_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          confirmed_points: number
          display_name: string
          exact_count: number
          projected_points: number
          rank: number
          user_id: string
        }[]
      }
      get_user_live_breakdown: {
        Args: { p_user_id: string }
        Returns: {
          away_team_flag: string
          away_team_name: string
          home_team_flag: string
          home_team_name: string
          live_away_score: number
          live_home_score: number
          match_id: string
          pred_away_score: number
          pred_home_score: number
          provisional_pts: number
          tier: string
        }[]
      }
      is_group_member: { Args: { p_group_id: string }; Returns: boolean }
      recalculate_all_predictions: {
        Args: { p_competition_id: string }
        Returns: number
      }
      recalculate_phase_predictions: {
        Args: {
          p_competition_id: string
          p_phase: Database["public"]["Enums"]["round_phase"]
        }
        Returns: number
      }
      shares_group_with: { Args: { p_other_user_id: string }; Returns: boolean }
    }
    Enums: {
      competition_status: "upcoming" | "active" | "completed"
      match_status: "upcoming" | "live" | "completed"
      round_phase:
        | "group"
        | "round_of_32"
        | "round_of_16"
        | "quarter_final"
        | "semi_final"
        | "third_place"
        | "final"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      competition_status: ["upcoming", "active", "completed"],
      match_status: ["upcoming", "live", "completed"],
      round_phase: [
        "group",
        "round_of_32",
        "round_of_16",
        "quarter_final",
        "semi_final",
        "third_place",
        "final",
      ],
    },
  },
} as const
