-- Add UNIQUE constraints on external_id for teams and matches.
-- Required for upsert (ON CONFLICT) in the seed script.
ALTER TABLE public.teams   ADD CONSTRAINT teams_external_id_unique   UNIQUE (external_id);
ALTER TABLE public.matches ADD CONSTRAINT matches_external_id_unique UNIQUE (external_id);
