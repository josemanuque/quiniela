-- =============================================================================
-- Migration: get_user_live_breakdown — per-user live match scoring breakdown
-- Returns each live match where the user has an unscored prediction,
-- with tier classification and provisional points.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_user_live_breakdown(p_user_id UUID)
RETURNS TABLE (
  match_id         UUID,
  home_team_name   TEXT,
  away_team_name   TEXT,
  home_team_flag   TEXT,
  away_team_flag   TEXT,
  live_home_score  INT,
  live_away_score  INT,
  pred_home_score  INT,
  pred_away_score  INT,
  provisional_pts  INT,
  tier             TEXT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    m.id,
    ht.name,
    at.name,
    ht.flag_url,
    at.flag_url,
    m.home_score,
    m.away_score,
    pred.home_score,
    pred.away_score,
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
    )::NUMERIC * sc.phase_multiplier)::INT,
    CASE
      WHEN pred.home_score = m.home_score AND pred.away_score = m.away_score
        THEN 'exact'
      WHEN (pred.home_score = m.home_score OR pred.away_score = m.away_score)
        AND SIGN(pred.home_score - pred.away_score) = SIGN(m.home_score - m.away_score)
        THEN 'partial_correct'
      WHEN SIGN(pred.home_score - pred.away_score) = SIGN(m.home_score - m.away_score)
        THEN 'correct_winner'
      WHEN pred.home_score = m.home_score OR pred.away_score = m.away_score
        THEN 'partial_wrong'
      ELSE 'miss'
    END
  FROM  public.matches m
  JOIN  public.teams ht   ON ht.id   = m.home_team_id
  JOIN  public.teams at   ON at.id   = m.away_team_id
  JOIN  public.predictions pred
    ON  pred.match_id = m.id AND pred.user_id = p_user_id
  JOIN  public.rounds r   ON r.id    = m.round_id
  JOIN  public.scoring_configurations sc
    ON  sc.competition_id = r.competition_id AND sc.phase = r.phase
  WHERE m.status          = 'live'
    AND m.home_score      IS NOT NULL
    AND m.away_score      IS NOT NULL
    AND pred.points_earned IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_live_breakdown(UUID) TO authenticated;
