-- Allow TBD knockout matches: nullable team IDs + label columns.
-- sync-matches creates these immediately, then resolves team IDs
-- as referenced matches complete (hourly cron).

ALTER TABLE public.matches
  ALTER COLUMN home_team_id DROP NOT NULL,
  ALTER COLUMN away_team_id DROP NOT NULL;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS home_team_label TEXT,
  ADD COLUMN IF NOT EXISTS away_team_label TEXT;

-- The existing different_teams check uses != which yields NULL (passes) when
-- either side is NULL, so TBD matches are already safe. No change needed.
