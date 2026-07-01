-- =============================================================================
-- Migration: get_my_profile_stats — returns points, rank, and prediction stats
-- for the currently authenticated user in a single round-trip.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_my_profile_stats()
RETURNS TABLE (
  total_points        INT,
  global_rank         BIGINT,
  predictions_made    INT,
  scored_predictions  INT,
  correct_predictions INT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH ranked AS (
    SELECT
      p.user_id,
      COALESCE(SUM(p.points_earned), 0)::INT                         AS total_pts,
      RANK() OVER (ORDER BY COALESCE(SUM(p.points_earned), 0) DESC) AS rnk
    FROM public.predictions p
    WHERE p.points_earned IS NOT NULL
    GROUP BY p.user_id
  ),
  my_preds AS (
    SELECT
      COUNT(*)::INT                                           AS total,
      COUNT(*) FILTER (WHERE points_earned IS NOT NULL)::INT AS scored,
      COUNT(*) FILTER (WHERE points_earned > 0)::INT         AS correct
    FROM public.predictions
    WHERE user_id = auth.uid()
  )
  SELECT
    COALESCE((SELECT total_pts FROM ranked WHERE user_id = auth.uid()), 0),
    (SELECT rnk          FROM ranked   WHERE user_id = auth.uid()),
    (SELECT total        FROM my_preds),
    (SELECT scored       FROM my_preds),
    (SELECT correct      FROM my_preds);
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile_stats() TO authenticated;
