-- =============================================================================
-- Migration: Bonus points + per-jornada leaderboard RPC
--
-- 1. Apply bonus points to r32 jornada for 3 users
--    (36551 / Armando +0.5 pts is skipped — INT column can't store decimals)
-- 2. Add get_jornada_leaderboard() for the round filter UI
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Bonus points adjustments (added to r32)
--    36550 Jose Manuel  +10 → r32 was 40, now 50
--    11389 Daniel        +4 → r32 was 41, now 45
--    36561 Richi         +6 → r32 was 33, now 39
-- ---------------------------------------------------------------------------

UPDATE public.historical_points
SET points = 50
WHERE user_id = 'df2dc06a-fb51-49eb-841b-87089cee965a'
  AND competition_id = 'a0000000-0000-0000-0000-000000000001'
  AND jornada = 'r32';

UPDATE public.historical_points
SET points = 45
WHERE user_id = 'd376e1a0-71eb-4e68-b672-928a809d820b'
  AND competition_id = 'a0000000-0000-0000-0000-000000000001'
  AND jornada = 'r32';

UPDATE public.historical_points
SET points = 39
WHERE user_id = 'c46a6cdc-1132-4ba1-b86a-84e4a4b0f967'
  AND competition_id = 'a0000000-0000-0000-0000-000000000001'
  AND jornada = 'r32';

-- ---------------------------------------------------------------------------
-- 2. Per-jornada leaderboard (for round filter UI)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_jornada_leaderboard(
  p_jornada  TEXT,
  p_group_id UUID DEFAULT NULL
)
RETURNS TABLE(
  user_id      UUID,
  display_name TEXT,
  avatar_url   TEXT,
  jornada_pts  INT,
  rank         BIGINT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH eligible_users AS (
    SELECT pr.id AS user_id, pr.display_name, pr.avatar_url
    FROM public.profiles pr
    WHERE (
      -- Global: any authenticated user; Group: must be a member
      p_group_id IS NULL
      OR (
        EXISTS (
          SELECT 1 FROM public.group_members gm
          WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid()
        )
        AND EXISTS (
          SELECT 1 FROM public.group_members gm2
          WHERE gm2.group_id = p_group_id AND gm2.user_id = pr.id
        )
      )
    )
  ),
  -- Historical jornadas (group_1/2/3/r32)
  hist_pts AS (
    SELECT hp.user_id, hp.points AS pts
    FROM   public.historical_points hp
    WHERE  hp.jornada = p_jornada
  ),
  -- Real prediction jornadas (r16+)
  real_pts AS (
    SELECT p.user_id, p.points_earned AS pts
    FROM   public.predictions p
    JOIN   public.matches m ON m.id  = p.match_id
    JOIN   public.rounds  r ON r.id  = m.round_id
    WHERE  r.phase = ANY(
             CASE p_jornada
               WHEN 'r16'   THEN ARRAY['round_of_16'  ]::round_phase[]
               WHEN 'qf'    THEN ARRAY['quarter_final']::round_phase[]
               WHEN 'sf'    THEN ARRAY['semi_final'   ]::round_phase[]
               WHEN 'final' THEN ARRAY['final','third_place']::round_phase[]
               ELSE              ARRAY[]::round_phase[]
             END
           )
      AND  p.points_earned IS NOT NULL
  ),
  combined AS (
    SELECT user_id, SUM(pts)::INT AS jornada_pts
    FROM   (SELECT * FROM hist_pts UNION ALL SELECT * FROM real_pts) all_pts
    GROUP  BY user_id
  )
  SELECT
    eu.user_id,
    eu.display_name,
    eu.avatar_url,
    COALESCE(c.jornada_pts, 0)                           AS jornada_pts,
    RANK() OVER (ORDER BY COALESCE(c.jornada_pts, 0) DESC) AS rank
  FROM eligible_users eu
  JOIN combined c ON c.user_id = eu.user_id
  ORDER BY rank;
$$;

GRANT EXECUTE ON FUNCTION public.get_jornada_leaderboard(TEXT, UUID) TO authenticated;
