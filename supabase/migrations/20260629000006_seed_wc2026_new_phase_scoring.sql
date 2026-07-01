-- =============================================================================
-- Migration: Seed WC 2026 scoring for newly added phases
-- Must run after 20260629000004_add_missing_enum_values.sql so the enum values exist
-- =============================================================================

INSERT INTO public.scoring_configurations (competition_id, phase, exact_score_points, correct_result_points)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'round_of_32', 6,  3),
  ('a0000000-0000-0000-0000-000000000001', 'third_place', 10, 5)
ON CONFLICT (competition_id, phase) DO NOTHING;