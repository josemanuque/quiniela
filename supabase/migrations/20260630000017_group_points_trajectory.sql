-- Returns cumulative points per group member, sliced by round / day / match.
-- x_sort is zero-padded (rounds) or ISO-sortable (dates, timestamps) so ORDER BY x_sort
-- always produces the correct chronological sequence.
CREATE OR REPLACE FUNCTION public.get_group_points_trajectory(
  p_group_id    UUID,
  p_granularity TEXT DEFAULT 'round'   -- 'round' | 'day' | 'match'
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
  WITH members AS (
    SELECT gm.user_id, pr.display_name, pr.avatar_url
    FROM   public.group_members gm
    JOIN   public.profiles pr ON pr.id = gm.user_id
    WHERE  gm.group_id = p_group_id
  ),
  base AS (
    SELECT
      p.user_id,
      p.points_earned,
      CASE p_granularity
        WHEN 'round' THEN LPAD(r.order_index::TEXT, 6, '0')
        WHEN 'day'   THEN DATE(m.kickoff_at)::TEXT
        ELSE              m.kickoff_at::TEXT
      END AS x_sort,
      CASE p_granularity
        WHEN 'round' THEN r.name
        WHEN 'day'   THEN TO_CHAR(m.kickoff_at, 'Mon DD')
        ELSE              ht.short_name || ' – ' || at.short_name
      END AS x_label
    FROM   public.predictions p
    JOIN   public.matches  m  ON m.id  = p.match_id
    JOIN   public.rounds   r  ON r.id  = m.round_id
    JOIN   public.teams    ht ON ht.id = m.home_team_id
    JOIN   public.teams    at ON at.id = m.away_team_id
    JOIN   members         mb ON mb.user_id = p.user_id
    WHERE  p.points_earned IS NOT NULL
  ),
  grouped AS (
    SELECT user_id, x_sort, MAX(x_label) AS x_label,
           SUM(points_earned)::INT AS period_points
    FROM   base
    GROUP  BY user_id, x_sort
  )
  SELECT
    m.user_id,
    m.display_name,
    m.avatar_url,
    g.x_sort,
    g.x_label,
    g.period_points,
    SUM(g.period_points) OVER (
      PARTITION BY m.user_id
      ORDER BY     g.x_sort
      ROWS UNBOUNDED PRECEDING
    )::INT AS cumulative_points
  FROM   members m
  JOIN   grouped  g ON g.user_id = m.user_id
  ORDER  BY g.x_sort, m.display_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_points_trajectory(UUID, TEXT) TO authenticated;
