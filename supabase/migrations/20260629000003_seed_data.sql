-- =============================================================================
-- Migration: Seed Data
-- FIFA World Cup 2026 competition + scoring configuration per round phase
-- Points escalate in knock-out rounds to reward higher-stakes predictions
-- =============================================================================

INSERT INTO public.competitions (id, name, slug, season, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'FIFA World Cup 2026',
  'wc-2026',
  2026,
  'upcoming'
)
ON CONFLICT (slug) DO NOTHING;

-- Scoring: exact_score_points = correct scoreline, correct_result_points = right outcome wrong score
INSERT INTO public.scoring_configurations (competition_id, phase, exact_score_points, correct_result_points)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'group',          5,  2),
  ('a0000000-0000-0000-0000-000000000001', 'round_of_16',    6,  3),
  ('a0000000-0000-0000-0000-000000000001', 'quarter_final',  8,  4),
  ('a0000000-0000-0000-0000-000000000001', 'semi_final',    10,  5),
  ('a0000000-0000-0000-0000-000000000001', 'final',         15,  7)
ON CONFLICT (competition_id, phase) DO NOTHING;
