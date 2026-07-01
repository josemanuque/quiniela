-- Widens read policies on public tables to also cover the anon role
-- (previously only granted to authenticated). Idempotent via DROP IF EXISTS.

DROP POLICY IF EXISTS "competitions: public read"          ON public.competitions;
DROP POLICY IF EXISTS "teams: public read"                 ON public.teams;
DROP POLICY IF EXISTS "rounds: public read"                ON public.rounds;
DROP POLICY IF EXISTS "matches: public read"               ON public.matches;
DROP POLICY IF EXISTS "scoring_configurations: public read" ON public.scoring_configurations;

CREATE POLICY "competitions: public read"
  ON public.competitions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "teams: public read"
  ON public.teams FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "rounds: public read"
  ON public.rounds FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "matches: public read"
  ON public.matches FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "scoring_configurations: public read"
  ON public.scoring_configurations FOR SELECT TO anon, authenticated USING (true);

NOTIFY pgrst, 'reload schema';
