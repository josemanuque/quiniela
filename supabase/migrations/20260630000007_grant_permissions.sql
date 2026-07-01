-- Grant service_role full access to all tables (needed for seed scripts and server-side ops).
-- Grant anon/authenticated SELECT on public read-only tables (belt-and-suspenders alongside RLS).

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO service_role;

GRANT SELECT ON public.competitions          TO anon, authenticated;
GRANT SELECT ON public.teams                 TO anon, authenticated;
GRANT SELECT ON public.rounds                TO anon, authenticated;
GRANT SELECT ON public.matches               TO anon, authenticated;
GRANT SELECT ON public.scoring_configurations TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members      TO authenticated;
GRANT SELECT                         ON public.leaderboard_entries TO authenticated;
