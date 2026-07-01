-- =============================================================================
-- Migration: Scoring trigger, global leaderboard functions, Realtime, RLS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable Realtime for live score updates and leaderboard refresh
-- ---------------------------------------------------------------------------
ALTER TABLE public.matches     REPLICA IDENTITY FULL;
ALTER TABLE public.predictions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'predictions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Widen groups SELECT policy so non-members can look up by invite code
-- (groups table contains no sensitive data; invite_code is the secret link)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "groups: members can read" ON public.groups;

CREATE POLICY "groups: authenticated users can read"
  ON public.groups FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Scoring trigger: auto-scores predictions when a match transitions → completed
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_match_predictions()
RETURNS TRIGGER AS $$
DECLARE
  v_exact_pts   INT;
  v_result_pts  INT;
  v_home_result INT;
BEGIN
  -- Only fire on status transition to 'completed'
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;
  IF NEW.home_score IS NULL OR NEW.away_score IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up scoring config via round phase
  SELECT sc.exact_score_points, sc.correct_result_points
  INTO   v_exact_pts, v_result_pts
  FROM   public.rounds r
  JOIN   public.scoring_configurations sc
    ON   sc.competition_id = r.competition_id
    AND  sc.phase          = r.phase
  WHERE  r.id = NEW.round_id;

  IF v_exact_pts IS NULL THEN
    RETURN NEW; -- no scoring config for this phase, skip silently
  END IF;

  v_home_result := SIGN(NEW.home_score - NEW.away_score);

  UPDATE public.predictions
  SET
    points_earned = CASE
      WHEN home_score = NEW.home_score AND away_score = NEW.away_score THEN v_exact_pts
      WHEN SIGN(home_score - away_score) = v_home_result               THEN v_result_pts
      ELSE 0
    END,
    updated_at = now()
  WHERE match_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER score_predictions_on_match_complete
  AFTER UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.calculate_match_predictions();

-- ---------------------------------------------------------------------------
-- Global confirmed leaderboard — aggregates points_earned from completed matches
-- SECURITY DEFINER: bypasses RLS to aggregate across all users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_global_leaderboard()
RETURNS TABLE (
  user_id      UUID,
  display_name TEXT,
  avatar_url   TEXT,
  total_points INT,
  rank         BIGINT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    p.user_id,
    pr.display_name,
    pr.avatar_url,
    COALESCE(SUM(p.points_earned), 0)::INT                         AS total_points,
    RANK() OVER (ORDER BY COALESCE(SUM(p.points_earned), 0) DESC) AS rank
  FROM public.predictions p
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.points_earned IS NOT NULL
  GROUP BY p.user_id, pr.display_name, pr.avatar_url;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_leaderboard() TO authenticated;

-- ---------------------------------------------------------------------------
-- Projected leaderboard — confirmed points + provisional from live matches
-- Shows how rankings would look if current scores hold
-- SECURITY DEFINER: reads all predictions regardless of group membership
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
      lm.id                                        AS match_id,
      sc.exact_score_points                        AS exact_pts,
      sc.correct_result_points                     AS result_pts,
      SIGN(lm.home_score - lm.away_score)::INT     AS home_result,
      lm.home_score,
      lm.away_score
    FROM live_matches lm
    JOIN public.rounds r ON r.id = lm.round_id
    JOIN public.scoring_configurations sc
      ON  sc.competition_id = r.competition_id
      AND sc.phase          = r.phase
  ),
  live_provisional AS (
    SELECT
      p.user_id,
      SUM(CASE
        WHEN p.home_score = s.home_score AND p.away_score = s.away_score THEN s.exact_pts
        WHEN SIGN(p.home_score - p.away_score)::INT = s.home_result      THEN s.result_pts
        ELSE 0
      END)::INT AS live_pts
    FROM public.predictions p
    JOIN scoring s ON s.match_id = p.match_id
    WHERE p.points_earned IS NULL  -- only count unscored (live) predictions
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
  FROM       public.profiles       pr
  LEFT JOIN  confirmed              c   ON c.user_id  = pr.id
  LEFT JOIN  live_provisional       lp  ON lp.user_id = pr.id
  WHERE c.pts IS NOT NULL OR lp.live_pts IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_projected_leaderboard() TO authenticated;

-- ---------------------------------------------------------------------------
-- Mark WC 2026 competition as active (tournament is underway)
-- ---------------------------------------------------------------------------
UPDATE public.competitions
SET    status     = 'active',
       updated_at = now()
WHERE  id = 'a0000000-0000-0000-0000-000000000001';
