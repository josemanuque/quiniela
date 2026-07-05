-- Add matchday (1/2/3) to group-stage matches so the frontend can group them
-- into R1 / R2 / R3 tabs instead of showing all 12 individual group pills.
--
-- For a 4-team group (6 matches):
--   rank 1,2 by kickoff_at within the group round → matchday 1
--   rank 3,4 → matchday 2
--   rank 5,6 → matchday 3
-- CEILING(rank / 2.0) produces exactly 1, 1, 2, 2, 3, 3.

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS matchday SMALLINT;

WITH ranked AS (
  SELECT
    m.id,
    CEILING(
      ROW_NUMBER() OVER (PARTITION BY m.round_id ORDER BY m.kickoff_at)
      / 2.0
    )::SMALLINT AS md
  FROM public.matches m
  JOIN public.rounds r ON r.id = m.round_id
  WHERE r.phase = 'group'
)
UPDATE public.matches
SET matchday = ranked.md
FROM ranked
WHERE public.matches.id = ranked.id;
