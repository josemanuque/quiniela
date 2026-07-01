-- =============================================================================
-- Migration: Scoring v2 — 4-tier system with phase multiplier
--
-- Tiers (base points, before multiplier):
--   1. Exact score              → 5 pts  (e.g. predict 2-0, actual 2-0)
--   2. Partial + correct winner → 3 pts  (one score matches, right winner)
--   3. Correct winner only      → 2 pts  (right winner, no score matches)
--   4. Partial + wrong winner   → 1 pt   (one score matches, wrong winner)
--   5. Everything wrong         → 0 pts
--
-- Multiplier:
--   group phase   → 1.0  (final: 5, 3, 2, 1)
--   knockout (r32+) → 2.0  (final: 10, 6, 4, 2)
--
-- Changing the multiplier after the fact:
--   UPDATE scoring_configurations SET phase_multiplier = X WHERE ...;
--   SELECT recalculate_all_predictions('<competition_id>');
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extend scoring_configurations with the two new tier columns + multiplier
-- ---------------------------------------------------------------------------
ALTER TABLE public.scoring_configurations
  ADD COLUMN IF NOT EXISTS partial_correct_winner_points INT          NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS partial_wrong_winner_points   INT          NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS phase_multiplier              NUMERIC(3,1) NOT NULL DEFAULT 1.0;

-- ---------------------------------------------------------------------------
-- Seed WC 2026 values
-- Group phase: base points, multiplier 1×
-- All knockout phases: same base points, multiplier 2×
-- ---------------------------------------------------------------------------
UPDATE public.scoring_configurations
SET
  exact_score_points            = 5,
  partial_correct_winner_points = 3,
  correct_result_points         = 2,
  partial_wrong_winner_points   = 1,
  phase_multiplier              = 1.0
WHERE competition_id = 'a0000000-0000-0000-0000-000000000001'
  AND phase = 'group';

UPDATE public.scoring_configurations
SET
  exact_score_points            = 5,
  partial_correct_winner_points = 3,
  correct_result_points         = 2,
  partial_wrong_winner_points   = 1,
  phase_multiplier              = 2.0
WHERE competition_id = 'a0000000-0000-0000-0000-000000000001'
  AND phase != 'group';

-- ---------------------------------------------------------------------------
-- Scoring trigger: 4-tier version with multiplier
-- Fires AFTER UPDATE on matches when status transitions → completed
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_match_predictions()
RETURNS TRIGGER AS $$
DECLARE
  v_exact_pts  INT;
  v_partial_c  INT;
  v_result_pts INT;
  v_partial_w  INT;
  v_multiplier NUMERIC(3,1);
BEGIN
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN RETURN NEW; END IF;
  IF NEW.home_score IS NULL OR NEW.away_score IS NULL THEN RETURN NEW; END IF;

  SELECT
    sc.exact_score_points,
    sc.partial_correct_winner_points,
    sc.correct_result_points,
    sc.partial_wrong_winner_points,
    sc.phase_multiplier
  INTO v_exact_pts, v_partial_c, v_result_pts, v_partial_w, v_multiplier
  FROM  public.rounds r
  JOIN  public.scoring_configurations sc
    ON  sc.competition_id = r.competition_id AND sc.phase = r.phase
  WHERE r.id = NEW.round_id;

  IF v_exact_pts IS NULL THEN RETURN NEW; END IF;

  UPDATE public.predictions
  SET
    points_earned = ROUND((
      CASE
        -- Tier 1: exact score
        WHEN home_score = NEW.home_score AND away_score = NEW.away_score
          THEN v_exact_pts
        -- Tier 2: one score matches + correct winner
        WHEN (home_score = NEW.home_score OR away_score = NEW.away_score)
          AND SIGN(home_score - away_score) = SIGN(NEW.home_score - NEW.away_score)
          THEN v_partial_c
        -- Tier 3: correct winner, no score match
        WHEN SIGN(home_score - away_score) = SIGN(NEW.home_score - NEW.away_score)
          THEN v_result_pts
        -- Tier 4: one score matches, wrong winner
        WHEN home_score = NEW.home_score OR away_score = NEW.away_score
          THEN v_partial_w
        ELSE 0
      END
    )::NUMERIC * v_multiplier)::INT,
    updated_at = now()
  WHERE match_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Updated get_projected_leaderboard: same 4-tier logic as the trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_projected_leaderboard()
RETURNS TABLE (
  user_id          UUID,
  display_name     TEXT,
  avatar_url       TEXT,
  confirmed_points INT,
  projected_points INT,
  rank             BIGINT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH confirmed AS (
    SELECT p.user_id, COALESCE(SUM(p.points_earned), 0)::INT AS pts
    FROM   public.predictions p
    WHERE  p.points_earned IS NOT NULL
    GROUP BY p.user_id
  ),
  live_matches AS (
    SELECT m.id, m.home_score, m.away_score, m.round_id
    FROM   public.matches m
    WHERE  m.status = 'live'
      AND  m.home_score IS NOT NULL
      AND  m.away_score IS NOT NULL
  ),
  scoring AS (
    SELECT
      lm.id                                      AS match_id,
      sc.exact_score_points                      AS exact_pts,
      sc.partial_correct_winner_points           AS partial_c_pts,
      sc.correct_result_points                   AS result_pts,
      sc.partial_wrong_winner_points             AS partial_w_pts,
      sc.phase_multiplier                        AS multiplier,
      SIGN(lm.home_score - lm.away_score)::INT   AS home_result,
      lm.home_score,
      lm.away_score
    FROM live_matches lm
    JOIN public.rounds r ON r.id = lm.round_id
    JOIN public.scoring_configurations sc
      ON  sc.competition_id = r.competition_id AND sc.phase = r.phase
  ),
  live_provisional AS (
    SELECT
      p.user_id,
      COALESCE(SUM(
        ROUND((
          CASE
            WHEN p.home_score = s.home_score AND p.away_score = s.away_score
              THEN s.exact_pts
            WHEN (p.home_score = s.home_score OR p.away_score = s.away_score)
              AND SIGN(p.home_score - p.away_score)::INT = s.home_result
              THEN s.partial_c_pts
            WHEN SIGN(p.home_score - p.away_score)::INT = s.home_result
              THEN s.result_pts
            WHEN p.home_score = s.home_score OR p.away_score = s.away_score
              THEN s.partial_w_pts
            ELSE 0
          END
        )::NUMERIC * s.multiplier)::INT
      ), 0)::INT AS live_pts
    FROM public.predictions p
    JOIN scoring s ON s.match_id = p.match_id
    WHERE p.points_earned IS NULL
    GROUP BY p.user_id
  )
  SELECT
    pr.id                                                        AS user_id,
    pr.display_name,
    pr.avatar_url,
    COALESCE(c.pts, 0)                                           AS confirmed_points,
    (COALESCE(c.pts, 0) + COALESCE(lp.live_pts, 0))             AS projected_points,
    RANK() OVER (
      ORDER BY (COALESCE(c.pts, 0) + COALESCE(lp.live_pts, 0)) DESC
    )                                                            AS rank
  FROM       public.profiles pr
  LEFT JOIN  confirmed        c  ON c.user_id  = pr.id
  LEFT JOIN  live_provisional lp ON lp.user_id = pr.id
  WHERE c.pts IS NOT NULL OR lp.live_pts IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_projected_leaderboard() TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin helper: recalculate all scored predictions for one phase
-- Use after changing phase_multiplier in scoring_configurations
-- Example: SELECT recalculate_phase_predictions('a000...', 'quarter_final');
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_phase_predictions(
  p_competition_id UUID,
  p_phase          round_phase
)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.predictions pred
  SET
    points_earned = (
      SELECT ROUND((
        CASE
          WHEN pred.home_score = m.home_score AND pred.away_score = m.away_score
            THEN sc.exact_score_points
          WHEN (pred.home_score = m.home_score OR pred.away_score = m.away_score)
            AND SIGN(pred.home_score - pred.away_score) = SIGN(m.home_score - m.away_score)
            THEN sc.partial_correct_winner_points
          WHEN SIGN(pred.home_score - pred.away_score) = SIGN(m.home_score - m.away_score)
            THEN sc.correct_result_points
          WHEN pred.home_score = m.home_score OR pred.away_score = m.away_score
            THEN sc.partial_wrong_winner_points
          ELSE 0
        END
      )::NUMERIC * sc.phase_multiplier)::INT
      FROM  public.matches m
      JOIN  public.rounds  r  ON r.id = m.round_id
      JOIN  public.scoring_configurations sc
        ON  sc.competition_id = r.competition_id AND sc.phase = r.phase
      WHERE m.id             = pred.match_id
        AND m.status         = 'completed'
        AND m.home_score     IS NOT NULL
        AND m.away_score     IS NOT NULL
        AND r.competition_id = p_competition_id
        AND r.phase          = p_phase
    ),
    updated_at = now()
  WHERE pred.match_id IN (
    SELECT m.id
    FROM   public.matches m
    JOIN   public.rounds  r ON r.id = m.round_id
    WHERE  m.status         = 'completed'
      AND  m.home_score     IS NOT NULL
      AND  m.away_score     IS NOT NULL
      AND  r.competition_id = p_competition_id
      AND  r.phase          = p_phase
  );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- Recalculate all phases in a competition in one call
CREATE OR REPLACE FUNCTION public.recalculate_all_predictions(p_competition_id UUID)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total INT := 0;
  v_phase round_phase;
BEGIN
  FOR v_phase IN
    SELECT DISTINCT r.phase
    FROM   public.rounds r
    WHERE  r.competition_id = p_competition_id
  LOOP
    v_total := v_total + public.recalculate_phase_predictions(p_competition_id, v_phase);
  END LOOP;
  RETURN v_total;
END;
$$;
