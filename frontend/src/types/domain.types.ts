import type { Tables, Enums } from './database.types'

// ---------------------------------------------------------------------------
// Enum aliases — use these in application code, not raw string literals
// ---------------------------------------------------------------------------
export type CompetitionStatus = Enums<'competition_status'>
export type MatchStatus       = Enums<'match_status'>
export type RoundPhase        = Enums<'round_phase'>

// ---------------------------------------------------------------------------
// Plain table row types
// ---------------------------------------------------------------------------
export type Profile              = Tables<'profiles'>
export type Competition          = Tables<'competitions'>
export type Team                 = Tables<'teams'>
export type Round                = Tables<'rounds'>
export type Match                = Tables<'matches'>
export type Prediction           = Tables<'predictions'>
export type Group                = Tables<'groups'>
export type GroupMember          = Tables<'group_members'>
export type LeaderboardEntry     = Tables<'leaderboard_entries'>
export type ScoringConfiguration = Tables<'scoring_configurations'>

// ---------------------------------------------------------------------------
// Enriched join types used in the UI — built by service layer, never via
// direct Supabase embeds in components
// ---------------------------------------------------------------------------
export type MatchWithTeams = Match & {
  home_team: Team
  away_team: Team
  round: Round
}

export type LeaderboardEntryWithProfile = LeaderboardEntry & {
  profile: Profile
}

export type GroupWithMemberCount = Group & {
  member_count: number
}

export type PredictionWithMatch = Prediction & {
  match: MatchWithTeams
}
