-- =============================================================================
-- Migration: Penalty prediction support
--
-- 1. predictions.penalty_home_score / penalty_away_score
--    — user's predicted penalty shootout result (only for knockout draws)
-- 2. scoring_configurations.penalty_winner_points / penalty_exact_points
--    — configurable bonus points for correct penalty predictions
-- 3. Updated scoring trigger — adds penalty bonus on top of regular tier points
-- 4. Updated recalculate_phase_predictions — same bonus logic
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Schema changes
-- ---------------------------------------------------------------------------

ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS penalty_home_score INT,
  ADD COLUMN IF NOT EXISTS penalty_away_score INT;

ALTER TABLE public.scoring_configurations
  ADD COLUMN IF NOT EXISTS penalty_winner_points INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS penalty_exact_points  INT NOT NULL DEFAULT 2;

-- ---------------------------------------------------------------------------
-- 2. Updated scoring trigger — same tiers + penalty bonus
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_match_predictions()
RETURNS TRIGGER AS $$
DECLARE
  v_exact_pts      INT;
  v_partial_c      INT;
  v_result_pts     INT;
  v_partial_w      INT;
  v_multiplier     NUMERIC(3,1);
  v_penalty_winner INT;
  v_penalty_exact  INT;
BEGIN
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN RETURN NEW; END IF;
  IF NEW.home_score IS NULL OR NEW.away_score IS NULL THEN RETURN NEW; END IF;

  SELECT
    sc.exact_score_points,
    sc.partial_correct_winner_points,
    sc.correct_result_points,
    sc.partial_wrong_winner_points,
    sc.phase_multiplier,
    sc.penalty_winner_points,
    sc.penalty_exact_points
  INTO v_exact_pts, v_partial_c, v_result_pts, v_partial_w, v_multiplier,
       v_penalty_winner, v_penalty_exact
  FROM  public.rounds r
  JOIN  public.scoring_configurations sc
    ON  sc.competition_id = r.competition_id AND sc.phase = r.phase
  WHERE r.id = NEW.round_id;

  IF v_exact_pts IS NULL THEN RETURN NEW; END IF;

  UPDATE public.predictions
  SET
    tier = CASE
      WHEN home_score = NEW.home_score AND away_score = NEW.away_score
        THEN 'exact'
      WHEN (home_score = NEW.home_score OR away_score = NEW.away_score)
        AND SIGN(home_score - away_score) = SIGN(NEW.home_score - NEW.away_score)
        THEN 'partial_correct_winner'
      WHEN SIGN(home_score - away_score) = SIGN(NEW.home_score - NEW.away_score)
        THEN 'correct_winner'
      WHEN home_score = NEW.home_score OR away_score = NEW.away_score
        THEN 'partial_wrong'
      ELSE 'miss'
    END,
    points_earned =
      -- Base tier (multiplied by phase multiplier)
      ROUND((
        CASE
          WHEN home_score = NEW.home_score AND away_score = NEW.away_score
            THEN v_exact_pts
          WHEN (home_score = NEW.home_score OR away_score = NEW.away_score)
            AND SIGN(home_score - away_score) = SIGN(NEW.home_score - NEW.away_score)
            THEN v_partial_c
          WHEN SIGN(home_score - away_score) = SIGN(NEW.home_score - NEW.away_score)
            THEN v_result_pts
          WHEN home_score = NEW.home_score OR away_score = NEW.away_score
            THEN v_partial_w
          ELSE 0
        END
      )::NUMERIC * v_multiplier)::INT
      -- Penalty bonus (flat, not multiplied) — only when:
      --   • match went to penalties
      --   • prediction was a draw
      --   • user provided a penalty prediction
      + CASE
          WHEN NEW.home_penalties IS NOT NULL AND NEW.away_penalties IS NOT NULL
            AND SIGN(home_score - away_score) = 0
            AND penalty_home_score IS NOT NULL AND penalty_away_score IS NOT NULL
          THEN
            CASE
              WHEN penalty_home_score = NEW.home_penalties
                AND penalty_away_score = NEW.away_penalties
                THEN v_penalty_exact
              WHEN SIGN(penalty_home_score - penalty_away_score)
                 = SIGN(NEW.home_penalties - NEW.away_penalties)
                THEN v_penalty_winner
              ELSE 0
            END
          ELSE 0
        END,
    updated_at = now()
  WHERE match_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 3. Updated recalculate_phase_predictions — same penalty bonus logic
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
    tier = (
      SELECT CASE
        WHEN pred.home_score = m.home_score AND pred.away_score = m.away_score
          THEN 'exact'
        WHEN (pred.home_score = m.home_score OR pred.away_score = m.away_score)
          AND SIGN(pred.home_score - pred.away_score) = SIGN(m.home_score - m.away_score)
          THEN 'partial_correct_winner'
        WHEN SIGN(pred.home_score - pred.away_score) = SIGN(m.home_score - m.away_score)
          THEN 'correct_winner'
        WHEN pred.home_score = m.home_score OR pred.away_score = m.away_score
          THEN 'partial_wrong'
        ELSE 'miss'
      END
      FROM public.matches m WHERE m.id = pred.match_id AND m.status = 'completed'
    ),
    points_earned = (
      SELECT
        ROUND((
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
        + CASE
            WHEN m.home_penalties IS NOT NULL AND m.away_penalties IS NOT NULL
              AND SIGN(pred.home_score - pred.away_score) = 0
              AND pred.penalty_home_score IS NOT NULL AND pred.penalty_away_score IS NOT NULL
            THEN
              CASE
                WHEN pred.penalty_home_score = m.home_penalties
                  AND pred.penalty_away_score = m.away_penalties
                  THEN sc.penalty_exact_points
                WHEN SIGN(pred.penalty_home_score - pred.penalty_away_score)
                   = SIGN(m.home_penalties - m.away_penalties)
                  THEN sc.penalty_winner_points
                ELSE 0
              END
            ELSE 0
          END
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
