-- =============================================================================
-- Migration: Row Level Security Policies
-- Uses SECURITY DEFINER helper functions to avoid recursive policy evaluation
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER bypasses RLS inside the function body,
-- which is necessary when a policy on table T references table T itself)
-- ---------------------------------------------------------------------------

-- Returns true if auth.uid() is a member of the given group
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id  = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns true if auth.uid() shares at least one group with p_other_user_id
CREATE OR REPLACE FUNCTION public.shares_group_with(p_other_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = p_other_user_id
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_configurations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE POLICY "profiles: authenticated users can read all"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles: users can insert own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: users can update own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- competitions, teams, rounds, matches, scoring_configurations — public read
-- ---------------------------------------------------------------------------
CREATE POLICY "competitions: public read"
  ON public.competitions FOR SELECT TO authenticated USING (true);

CREATE POLICY "teams: public read"
  ON public.teams FOR SELECT TO authenticated USING (true);

CREATE POLICY "rounds: public read"
  ON public.rounds FOR SELECT TO authenticated USING (true);

CREATE POLICY "matches: public read"
  ON public.matches FOR SELECT TO authenticated USING (true);

CREATE POLICY "scoring_configurations: public read"
  ON public.scoring_configurations FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- predictions
--   • Own prediction: always visible
--   • Others' predictions: visible only after kickoff AND within a shared group
--   • INSERT / UPDATE blocked server-side once kickoff_at has passed
-- ---------------------------------------------------------------------------
CREATE POLICY "predictions: read own"
  ON public.predictions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "predictions: read group members post-kickoff"
  ON public.predictions FOR SELECT TO authenticated
  USING (
    user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.kickoff_at <= now()
    )
    AND public.shares_group_with(user_id)
  );

CREATE POLICY "predictions: insert own pre-kickoff"
  ON public.predictions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.kickoff_at > now()
    )
  );

CREATE POLICY "predictions: update own pre-kickoff"
  ON public.predictions FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND locked_at IS NULL
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.kickoff_at > now()
    )
  );

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
CREATE POLICY "groups: members can read"
  ON public.groups FOR SELECT TO authenticated
  USING (public.is_group_member(id));

CREATE POLICY "groups: authenticated users can create"
  ON public.groups FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "groups: owner can update"
  ON public.groups FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "groups: owner can delete"
  ON public.groups FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------------
CREATE POLICY "group_members: members can read"
  ON public.group_members FOR SELECT TO authenticated
  USING (public.is_group_member(group_id));

CREATE POLICY "group_members: users can join (insert self)"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "group_members: users can leave (delete self)"
  ON public.group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "group_members: owner can remove member"
  ON public.group_members FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id       = group_id
        AND g.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- leaderboard_entries — readable only by group members; written by server
-- ---------------------------------------------------------------------------
CREATE POLICY "leaderboard_entries: members can read"
  ON public.leaderboard_entries FOR SELECT TO authenticated
  USING (public.is_group_member(group_id));
