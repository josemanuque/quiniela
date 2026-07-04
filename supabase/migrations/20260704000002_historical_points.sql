-- =============================================================================
-- Migration: Historical points import
--
-- Stores per-jornada points imported from a previous prediction system.
-- These cover group_1 / group_2 / group_3 / r32 (fully played, no per-match
-- prediction data available).  R16 and beyond will accrue from real predictions.
--
-- Also:
-- 1. Deletes all predictions for group-stage + R32 matches (replaced by history).
-- 2. Updates every leaderboard RPC to sum historical + real prediction points.
-- 3. Adds get_jornada_trajectory() for the per-jornada cumulative chart.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

CREATE TABLE public.historical_points (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  competition_id UUID        NOT NULL REFERENCES public.competitions(id),
  jornada        TEXT        NOT NULL
    CHECK (jornada IN ('group_1','group_2','group_3','r32','r16','qf','sf','final')),
  points         INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, competition_id, jornada)
);

ALTER TABLE public.historical_points ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read (leaderboard is public within the app)
CREATE POLICY "authenticated can read historical points"
  ON public.historical_points FOR SELECT
  USING (auth.role() = 'authenticated');

GRANT SELECT ON TABLE public.historical_points TO authenticated;
GRANT ALL    ON TABLE public.historical_points TO service_role;

CREATE TRIGGER historical_points_updated_at
  BEFORE UPDATE ON public.historical_points
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Seed historical data
--    old id → new uuid
--    36550 (Jose Manuel Quesada)  → df2dc06a-fb51-49eb-841b-87089cee965a
--    11389 (Daniel Aranda Calvo)  → d376e1a0-71eb-4e68-b672-928a809d820b
--    24314 (Christopher Jiménez)  → 435a14a7-658d-4a09-a24a-daa772411387
--    36551 (Armando Casas)        → 73dea1d5-e074-4005-9453-2526dd2f1a39
--    36561 (Richi Solano)         → c46a6cdc-1132-4ba1-b86a-84e4a4b0f967
--    36564 (alejandro Necuze)     → NOT REGISTERED YET — insert manually once they sign up
-- ---------------------------------------------------------------------------

INSERT INTO public.historical_points (user_id, competition_id, jornada, points) VALUES
  -- Jose Manuel Quesada  [42, 41, 32, 40] = 155
  ('df2dc06a-fb51-49eb-841b-87089cee965a', 'a0000000-0000-0000-0000-000000000001', 'group_1', 42),
  ('df2dc06a-fb51-49eb-841b-87089cee965a', 'a0000000-0000-0000-0000-000000000001', 'group_2', 41),
  ('df2dc06a-fb51-49eb-841b-87089cee965a', 'a0000000-0000-0000-0000-000000000001', 'group_3', 32),
  ('df2dc06a-fb51-49eb-841b-87089cee965a', 'a0000000-0000-0000-0000-000000000001', 'r32',     40),
  -- Daniel Aranda Calvo  [40, 57, 48, 41] = 186
  ('d376e1a0-71eb-4e68-b672-928a809d820b', 'a0000000-0000-0000-0000-000000000001', 'group_1', 40),
  ('d376e1a0-71eb-4e68-b672-928a809d820b', 'a0000000-0000-0000-0000-000000000001', 'group_2', 57),
  ('d376e1a0-71eb-4e68-b672-928a809d820b', 'a0000000-0000-0000-0000-000000000001', 'group_3', 48),
  ('d376e1a0-71eb-4e68-b672-928a809d820b', 'a0000000-0000-0000-0000-000000000001', 'r32',     41),
  -- Christopher Jiménez  [34, 59, 37, 36] = 166
  ('435a14a7-658d-4a09-a24a-daa772411387', 'a0000000-0000-0000-0000-000000000001', 'group_1', 34),
  ('435a14a7-658d-4a09-a24a-daa772411387', 'a0000000-0000-0000-0000-000000000001', 'group_2', 59),
  ('435a14a7-658d-4a09-a24a-daa772411387', 'a0000000-0000-0000-0000-000000000001', 'group_3', 37),
  ('435a14a7-658d-4a09-a24a-daa772411387', 'a0000000-0000-0000-0000-000000000001', 'r32',     36),
  -- Armando Casas        [42, 51, 43, 39] = 175
  ('73dea1d5-e074-4005-9453-2526dd2f1a39', 'a0000000-0000-0000-0000-000000000001', 'group_1', 42),
  ('73dea1d5-e074-4005-9453-2526dd2f1a39', 'a0000000-0000-0000-0000-000000000001', 'group_2', 51),
  ('73dea1d5-e074-4005-9453-2526dd2f1a39', 'a0000000-0000-0000-0000-000000000001', 'group_3', 43),
  ('73dea1d5-e074-4005-9453-2526dd2f1a39', 'a0000000-0000-0000-0000-000000000001', 'r32',     39),
  -- Richi Solano         [40, 62, 37, 33] = 172
  ('c46a6cdc-1132-4ba1-b86a-84e4a4b0f967', 'a0000000-0000-0000-0000-000000000001', 'group_1', 40),
  ('c46a6cdc-1132-4ba1-b86a-84e4a4b0f967', 'a0000000-0000-0000-0000-000000000001', 'group_2', 62),
  ('c46a6cdc-1132-4ba1-b86a-84e4a4b0f967', 'a0000000-0000-0000-0000-000000000001', 'group_3', 37),
  ('c46a6cdc-1132-4ba1-b86a-84e4a4b0f967', 'a0000000-0000-0000-0000-000000000001', 'r32',     33)
ON CONFLICT (user_id, competition_id, jornada) DO UPDATE SET points = EXCLUDED.points;

-- ---------------------------------------------------------------------------
-- 3. Clear predictions for group stage + R32 (replaced by historical_points)
-- ---------------------------------------------------------------------------

DELETE FROM public.predictions
WHERE match_id IN (
  SELECT m.id
  FROM   public.matches m
  JOIN   public.rounds  r ON r.id = m.round_id
  WHERE  r.phase IN ('group', 'round_of_32')
);

-- ---------------------------------------------------------------------------
-- 4. Updated leaderboard RPCs — all now add historical_points to totals
-- ---------------------------------------------------------------------------

-- Global confirmed leaderboard
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
  WITH pred_totals AS (
    SELECT
      p.user_id,
      COALESCE(SUM(p.points_earned), 0)::INT AS pred_pts,
      COUNT(*) FILTER (
        WHERE m.home_score = p.home_score AND m.away_score = p.away_score
      )::INT AS exact_count
    FROM  public.predictions p
    JOIN  public.matches m ON m.id = p.match_id
    WHERE p.points_earned IS NOT NULL
    GROUP BY p.user_id
  ),
  hist_totals AS (
    SELECT user_id, SUM(points)::INT AS hist_pts
    FROM   public.historical_points
    GROUP  BY user_id
  )
  SELECT
    pr.id                                                                    AS user_id,
    pr.display_name,
    pr.avatar_url,
    (COALESCE(pt.pred_pts, 0) + COALESCE(ht.hist_pts, 0))::INT             AS total_points,
    COALESCE(pt.exact_count, 0)::INT                                        AS exact_count,
    RANK() OVER (
      ORDER BY (COALESCE(pt.pred_pts, 0) + COALESCE(ht.hist_pts, 0)) DESC
    )                                                                        AS rank
  FROM       public.profiles pr
  LEFT JOIN  pred_totals pt ON pt.user_id = pr.id
  LEFT JOIN  hist_totals ht ON ht.user_id = pr.id
  WHERE pt.pred_pts IS NOT NULL OR ht.hist_pts IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_leaderboard() TO authenticated;

-- Global projected leaderboard
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
  WITH pred_confirmed AS (
    SELECT
      p.user_id,
      COALESCE(SUM(p.points_earned), 0)::INT AS pts,
      COUNT(*) FILTER (
        WHERE m.home_score = p.home_score AND m.away_score = p.away_score
      )::INT AS exact_count
    FROM  public.predictions p
    JOIN  public.matches m ON m.id = p.match_id
    WHERE p.points_earned IS NOT NULL
    GROUP BY p.user_id
  ),
  hist_totals AS (
    SELECT user_id, SUM(points)::INT AS hist_pts
    FROM   public.historical_points
    GROUP  BY user_id
  ),
  live_matches AS (
    SELECT m.id, m.home_score, m.away_score, m.round_id
    FROM   public.matches m
    WHERE  m.status = 'live'
      AND  m.home_score IS NOT NULL AND m.away_score IS NOT NULL
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
    pr.id                                                                      AS user_id,
    pr.display_name,
    pr.avatar_url,
    (COALESCE(pc.pts, 0) + COALESCE(ht.hist_pts, 0))::INT                    AS confirmed_points,
    (COALESCE(pc.pts, 0) + COALESCE(ht.hist_pts, 0)
     + COALESCE(lp.live_pts, 0))::INT                                         AS projected_points,
    COALESCE(pc.exact_count, 0)::INT                                          AS exact_count,
    RANK() OVER (
      ORDER BY (COALESCE(pc.pts, 0) + COALESCE(ht.hist_pts, 0)
                + COALESCE(lp.live_pts, 0)) DESC
    )                                                                          AS rank
  FROM       public.profiles       pr
  LEFT JOIN  pred_confirmed        pc ON pc.user_id  = pr.id
  LEFT JOIN  hist_totals           ht ON ht.user_id  = pr.id
  LEFT JOIN  live_provisional      lp ON lp.user_id  = pr.id
  WHERE pc.pts IS NOT NULL OR ht.hist_pts IS NOT NULL OR lp.live_pts IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_projected_leaderboard() TO authenticated;

-- Group confirmed leaderboard
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
  WITH pred_totals AS (
    SELECT
      p.user_id,
      COALESCE(SUM(p.points_earned), 0)::INT AS pred_pts,
      COUNT(*) FILTER (
        WHERE m.home_score = p.home_score AND m.away_score = p.away_score
          AND p.points_earned IS NOT NULL
      )::INT AS exact_count
    FROM  public.predictions p
    JOIN  public.matches m ON m.id = p.match_id
    JOIN  public.group_members gm ON gm.user_id = p.user_id AND gm.group_id = p_group_id
    WHERE p.points_earned IS NOT NULL
    GROUP BY p.user_id
  ),
  hist_totals AS (
    SELECT hp.user_id, SUM(hp.points)::INT AS hist_pts
    FROM   public.historical_points hp
    JOIN   public.group_members gm ON gm.user_id = hp.user_id AND gm.group_id = p_group_id
    GROUP  BY hp.user_id
  )
  SELECT
    gm.user_id,
    pr.display_name,
    pr.avatar_url,
    (COALESCE(pt.pred_pts, 0) + COALESCE(ht.hist_pts, 0))::INT             AS total_points,
    COALESCE(pt.exact_count, 0)::INT                                        AS exact_count,
    RANK() OVER (
      ORDER BY (COALESCE(pt.pred_pts, 0) + COALESCE(ht.hist_pts, 0)) DESC
    )                                                                        AS rank
  FROM  public.group_members gm
  JOIN  public.profiles pr ON pr.id = gm.user_id
  LEFT  JOIN pred_totals pt ON pt.user_id = gm.user_id
  LEFT  JOIN hist_totals ht ON ht.user_id = gm.user_id
  WHERE gm.group_id = p_group_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE  group_id = p_group_id AND user_id = auth.uid()
    )
  GROUP BY gm.user_id, pr.display_name, pr.avatar_url,
           pt.pred_pts, pt.exact_count, ht.hist_pts;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_leaderboard(UUID) TO authenticated;

-- Group projected leaderboard
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
  WITH pred_confirmed AS (
    SELECT
      p.user_id,
      COALESCE(SUM(p.points_earned), 0)::INT AS pts,
      COUNT(*) FILTER (
        WHERE m.home_score = p.home_score AND m.away_score = p.away_score
      )::INT AS exact_count
    FROM  public.predictions p
    JOIN  public.matches m ON m.id = p.match_id
    JOIN  public.group_members gm ON gm.user_id = p.user_id AND gm.group_id = p_group_id
    WHERE p.points_earned IS NOT NULL
    GROUP BY p.user_id
  ),
  hist_totals AS (
    SELECT hp.user_id, SUM(hp.points)::INT AS hist_pts
    FROM   public.historical_points hp
    JOIN   public.group_members gm ON gm.user_id = hp.user_id AND gm.group_id = p_group_id
    GROUP  BY hp.user_id
  ),
  live_matches AS (
    SELECT m.id, m.home_score, m.away_score, m.round_id
    FROM   public.matches m
    WHERE  m.status = 'live'
      AND  m.home_score IS NOT NULL AND m.away_score IS NOT NULL
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
    (COALESCE(pc.pts, 0) + COALESCE(ht.hist_pts, 0))::INT                   AS confirmed_points,
    (COALESCE(pc.pts, 0) + COALESCE(ht.hist_pts, 0)
     + COALESCE(lp.live_pts, 0))::INT                                        AS projected_points,
    COALESCE(pc.exact_count, 0)::INT                                         AS exact_count,
    RANK() OVER (
      ORDER BY (COALESCE(pc.pts, 0) + COALESCE(ht.hist_pts, 0)
                + COALESCE(lp.live_pts, 0)) DESC
    )                                                                         AS rank
  FROM       public.group_members gm
  JOIN       public.profiles      pr ON pr.id      = gm.user_id
  LEFT JOIN  pred_confirmed       pc ON pc.user_id = gm.user_id
  LEFT JOIN  hist_totals          ht ON ht.user_id = gm.user_id
  LEFT JOIN  live_provisional     lp ON lp.user_id = gm.user_id
  WHERE gm.group_id = p_group_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE  group_id = p_group_id AND user_id = auth.uid()
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_group_projected_leaderboard(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Jornada trajectory — per-jornada cumulative points for the chart
--    Combines historical_points (group_1-3, r32) with real predictions (r16+)
--    p_group_id = NULL → global (all users with data)
--    p_group_id = uuid → group members only (caller must be a member)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_jornada_trajectory(
  p_group_id UUID DEFAULT NULL
)
RETURNS TABLE(
  user_id           UUID,
  display_name      TEXT,
  avatar_url        TEXT,
  x_sort            TEXT,
  x_label           TEXT,
  period_points     INT,
  cumulative_points INT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH eligible_users AS (
    SELECT pr.id AS user_id, pr.display_name, pr.avatar_url
    FROM   public.profiles pr
    WHERE (
      -- Group scope: caller must be a member; show only fellow members
      p_group_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.group_members gm2
        WHERE  gm2.group_id = p_group_id AND gm2.user_id = auth.uid()
      )
    )
    AND (
      p_group_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.group_members gm3
        WHERE  gm3.group_id = p_group_id AND gm3.user_id = pr.id
      )
    )
    AND (
      -- Has historical or scored predictions
      EXISTS (
        SELECT 1 FROM public.historical_points hp
        WHERE  hp.user_id = pr.id
      )
      OR EXISTS (
        SELECT 1 FROM public.predictions p2
        WHERE  p2.user_id = pr.id AND p2.points_earned IS NOT NULL
      )
    )
  ),
  -- Historical jornadas (imported from old system)
  hist AS (
    SELECT
      hp.user_id,
      CASE hp.jornada
        WHEN 'group_1' THEN '001'
        WHEN 'group_2' THEN '002'
        WHEN 'group_3' THEN '003'
        WHEN 'r32'     THEN '004'
        WHEN 'r16'     THEN '005'
        WHEN 'qf'      THEN '006'
        WHEN 'sf'      THEN '007'
        WHEN 'final'   THEN '008'
      END                    AS x_sort,
      CASE hp.jornada
        WHEN 'group_1' THEN 'J1'
        WHEN 'group_2' THEN 'J2'
        WHEN 'group_3' THEN 'J3'
        WHEN 'r32'     THEN 'R32'
        WHEN 'r16'     THEN 'R16'
        WHEN 'qf'      THEN 'QF'
        WHEN 'sf'      THEN 'SF'
        WHEN 'final'   THEN 'Final'
      END                    AS x_label,
      hp.points              AS period_points
    FROM public.historical_points hp
    JOIN eligible_users eu ON eu.user_id = hp.user_id
  ),
  -- Real prediction data for rounds NOT covered by historical import (r16+)
  real AS (
    SELECT
      p.user_id,
      CASE r.phase
        WHEN 'round_of_16'   THEN '005'
        WHEN 'quarter_final' THEN '006'
        WHEN 'semi_final'    THEN '007'
        WHEN 'third_place'   THEN '008'
        WHEN 'final'         THEN '008'
      END                    AS x_sort,
      CASE r.phase
        WHEN 'round_of_16'   THEN 'R16'
        WHEN 'quarter_final' THEN 'QF'
        WHEN 'semi_final'    THEN 'SF'
        WHEN 'third_place'   THEN 'Final'
        WHEN 'final'         THEN 'Final'
      END                    AS x_label,
      p.points_earned        AS period_points
    FROM public.predictions p
    JOIN public.matches m ON m.id  = p.match_id
    JOIN public.rounds  r ON r.id  = m.round_id
    JOIN eligible_users eu ON eu.user_id = p.user_id
    WHERE p.points_earned IS NOT NULL
      AND r.phase NOT IN ('group', 'round_of_32')
  ),
  combined AS (
    SELECT user_id, x_sort, MAX(x_label) AS x_label,
           SUM(period_points)::INT        AS period_points
    FROM (SELECT * FROM hist UNION ALL SELECT * FROM real) all_data
    WHERE x_sort IS NOT NULL
    GROUP BY user_id, x_sort
  )
  SELECT
    eu.user_id,
    eu.display_name,
    eu.avatar_url,
    c.x_sort,
    c.x_label,
    c.period_points,
    SUM(c.period_points) OVER (
      PARTITION BY eu.user_id
      ORDER BY     c.x_sort
      ROWS UNBOUNDED PRECEDING
    )::INT AS cumulative_points
  FROM eligible_users eu
  JOIN combined c ON c.user_id = eu.user_id
  ORDER BY c.x_sort, eu.display_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_jornada_trajectory(UUID) TO authenticated;
