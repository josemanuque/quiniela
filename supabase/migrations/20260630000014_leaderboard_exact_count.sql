-- =============================================================================
-- Migration: Add exact_count to all leaderboard functions
-- exact_count = number of completed predictions where both scores matched exactly
-- Must DROP first because the RETURNS TABLE signature changes.
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_global_leaderboard();
DROP FUNCTION IF EXISTS public.get_projected_leaderboard();
DROP FUNCTION IF EXISTS public.get_group_leaderboard(UUID);
DROP FUNCTION IF EXISTS public.get_group_projected_leaderboard(UUID);

-- ---------------------------------------------------------------------------
-- Global confirmed leaderboard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_global_leaderboard()
RETURNS TABLE (
  user_id      UUID,
  display_name TEXT,
  avatar_url   TEXT,
  total_points INT,
  exact_count  INT,
  rank         BIGINT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    p.user_id,
    pr.display_name,
    pr.avatar_url,
    COALESCE(SUM(p.points_earned), 0)::INT                         AS total_points,
    COUNT(*) FILTER (
      WHERE m.home_score = p.home_score AND m.away_score = p.away_score
    )::INT                                                         AS exact_count,
    RANK() OVER (ORDER BY COALESCE(SUM(p.points_earned), 0) DESC) AS rank
  FROM  public.predictions p
  JOIN  public.profiles pr ON pr.id     = p.user_id
  JOIN  public.matches  m  ON m.id      = p.match_id
  WHERE p.points_earned IS NOT NULL
  GROUP BY p.user_id, pr.display_name, pr.avatar_url;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_leaderboard() TO authenticated;

-- ---------------------------------------------------------------------------
-- Global projected leaderboard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_projected_leaderboard()
RETURNS TABLE (
  user_id          UUID,
  display_name     TEXT,
  avatar_url       TEXT,
  confirmed_points INT,
  projected_points INT,
  exact_count      INT,
  rank             BIGINT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH confirmed AS (
    SELECT
      p.user_id,
      COALESCE(SUM(p.points_earned), 0)::INT AS pts,
      COUNT(*) FILTER (
        WHERE m.home_score = p.home_score AND m.away_score = p.away_score
      )::INT                                 AS exact_count
    FROM  public.predictions p
    JOIN  public.matches m ON m.id = p.match_id
    WHERE p.points_earned IS NOT NULL
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
      lm.id                                     AS match_id,
      sc.exact_score_points                     AS exact_pts,
      sc.partial_correct_winner_points          AS partial_c_pts,
      sc.correct_result_points                  AS result_pts,
      sc.partial_wrong_winner_points            AS partial_w_pts,
      sc.phase_multiplier                       AS multiplier,
      SIGN(lm.home_score - lm.away_score)::INT  AS home_result,
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
            WHEN p.home_score = s.home_score AND p.away_score = s.away_score THEN s.exact_pts
            WHEN (p.home_score = s.home_score OR p.away_score = s.away_score)
              AND SIGN(p.home_score - p.away_score)::INT = s.home_result THEN s.partial_c_pts
            WHEN SIGN(p.home_score - p.away_score)::INT = s.home_result  THEN s.result_pts
            WHEN p.home_score = s.home_score OR p.away_score = s.away_score THEN s.partial_w_pts
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
    COALESCE(c.exact_count, 0)                                   AS exact_count,
    RANK() OVER (
      ORDER BY (COALESCE(c.pts, 0) + COALESCE(lp.live_pts, 0)) DESC
    )                                                            AS rank
  FROM       public.profiles       pr
  LEFT JOIN  confirmed              c  ON c.user_id  = pr.id
  LEFT JOIN  live_provisional       lp ON lp.user_id = pr.id
  WHERE c.pts IS NOT NULL OR lp.live_pts IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_projected_leaderboard() TO authenticated;

-- ---------------------------------------------------------------------------
-- Group confirmed leaderboard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_group_leaderboard(p_group_id UUID)
RETURNS TABLE (
  user_id      UUID,
  display_name TEXT,
  avatar_url   TEXT,
  total_points INT,
  exact_count  INT,
  rank         BIGINT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    gm.user_id,
    pr.display_name,
    pr.avatar_url,
    COALESCE(SUM(p.points_earned), 0)::INT                         AS total_points,
    COUNT(*) FILTER (
      WHERE m.home_score = p.home_score AND m.away_score = p.away_score
        AND p.points_earned IS NOT NULL
    )::INT                                                         AS exact_count,
    RANK() OVER (ORDER BY COALESCE(SUM(p.points_earned), 0) DESC) AS rank
  FROM  public.group_members gm
  JOIN  public.profiles pr ON pr.id = gm.user_id
  LEFT  JOIN public.predictions p ON p.user_id = gm.user_id AND p.points_earned IS NOT NULL
  LEFT  JOIN public.matches     m ON m.id       = p.match_id
  WHERE gm.group_id = p_group_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE  group_id = p_group_id AND user_id = auth.uid()
    )
  GROUP BY gm.user_id, pr.display_name, pr.avatar_url;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_leaderboard(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Group projected leaderboard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_group_projected_leaderboard(p_group_id UUID)
RETURNS TABLE (
  user_id          UUID,
  display_name     TEXT,
  avatar_url       TEXT,
  confirmed_points INT,
  projected_points INT,
  exact_count      INT,
  rank             BIGINT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH confirmed AS (
    SELECT
      p.user_id,
      COALESCE(SUM(p.points_earned), 0)::INT AS pts,
      COUNT(*) FILTER (
        WHERE m.home_score = p.home_score AND m.away_score = p.away_score
      )::INT                                 AS exact_count
    FROM  public.predictions p
    JOIN  public.matches m ON m.id = p.match_id
    JOIN  public.group_members gm ON gm.user_id = p.user_id AND gm.group_id = p_group_id
    WHERE p.points_earned IS NOT NULL
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
      lm.id                                     AS match_id,
      sc.exact_score_points                     AS exact_pts,
      sc.partial_correct_winner_points          AS partial_c_pts,
      sc.correct_result_points                  AS result_pts,
      sc.partial_wrong_winner_points            AS partial_w_pts,
      sc.phase_multiplier                       AS multiplier,
      SIGN(lm.home_score - lm.away_score)::INT  AS home_result,
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
            WHEN p.home_score = s.home_score AND p.away_score = s.away_score THEN s.exact_pts
            WHEN (p.home_score = s.home_score OR p.away_score = s.away_score)
              AND SIGN(p.home_score - p.away_score)::INT = s.home_result THEN s.partial_c_pts
            WHEN SIGN(p.home_score - p.away_score)::INT = s.home_result  THEN s.result_pts
            WHEN p.home_score = s.home_score OR p.away_score = s.away_score THEN s.partial_w_pts
            ELSE 0
          END
        )::NUMERIC * s.multiplier)::INT
      ), 0)::INT AS live_pts
    FROM public.predictions p
    JOIN scoring s ON s.match_id = p.match_id
    JOIN public.group_members gm ON gm.user_id = p.user_id AND gm.group_id = p_group_id
    WHERE p.points_earned IS NULL
    GROUP BY p.user_id
  )
  SELECT
    gm.user_id,
    pr.display_name,
    pr.avatar_url,
    COALESCE(c.pts, 0)                               AS confirmed_points,
    (COALESCE(c.pts, 0) + COALESCE(lp.live_pts, 0)) AS projected_points,
    COALESCE(c.exact_count, 0)                       AS exact_count,
    RANK() OVER (
      ORDER BY (COALESCE(c.pts, 0) + COALESCE(lp.live_pts, 0)) DESC
    )                                                AS rank
  FROM       public.group_members gm
  JOIN       public.profiles      pr ON pr.id       = gm.user_id
  LEFT JOIN  confirmed             c  ON c.user_id  = gm.user_id
  LEFT JOIN  live_provisional      lp ON lp.user_id = gm.user_id
  WHERE gm.group_id = p_group_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE  group_id = p_group_id AND user_id = auth.uid()
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_group_projected_leaderboard(UUID) TO authenticated;
