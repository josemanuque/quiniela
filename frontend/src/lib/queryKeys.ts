// Centralised TanStack Query key factory.
// All keys are const-tuples so TypeScript can narrow them precisely.
export const queryKeys = {
  profile:           (userId: string)       => ['profile', userId]                as const,
  activeCompetition: ()                     => ['competitions', 'active']         as const,
  competitions:      ()                     => ['competitions']                   as const,
  competition:       (slug: string)         => ['competitions', slug]             as const,
  rounds:            (competitionId: string) => ['rounds', competitionId]         as const,
  matches:           (roundId?: string)     => roundId
                                               ? ['matches', roundId]
                                               : ['matches']                      as const,
  match:             (matchId: string)      => ['matches', 'detail', matchId]     as const,
  predictions:       (matchId: string)      => ['predictions', matchId]           as const,
  myPrediction:      (matchId: string)      => ['predictions', matchId, 'mine']   as const,
  groups:            ()                     => ['groups']                         as const,
  group:             (groupId: string)      => ['groups', groupId]                as const,
  groupMembers:      (groupId: string)      => ['groups', groupId, 'members']     as const,
  leaderboard:       (scope: string, type: 'confirmed' | 'projected') => ['leaderboard', scope, type] as const,
  scoringConfig:     (competitionId: string) => ['scoring', competitionId]        as const,
} as const
