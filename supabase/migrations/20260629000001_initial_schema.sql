-- =============================================================================
-- Migration: Initial Schema
-- Creates all core tables, enums, triggers, and the profile auto-creation hook
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE competition_status AS ENUM ('upcoming', 'active', 'completed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE match_status      AS ENUM ('upcoming', 'live', 'completed');    EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE round_phase       AS ENUM ('group', 'round_of_16', 'quarter_final', 'semi_final', 'final'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------------------
-- Shared trigger: auto-set updated_at on every UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- profiles — mirrors auth.users, auto-populated on sign-up
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT        NOT NULL,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: create a profile row whenever a new Supabase user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- competitions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competitions (
  id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT               NOT NULL,
  slug        TEXT               NOT NULL UNIQUE,
  season      INT                NOT NULL,
  status      competition_status NOT NULL DEFAULT 'upcoming',
  external_id TEXT,
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ        NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  short_name  TEXT        NOT NULL,
  flag_url    TEXT,
  external_id TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- rounds
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rounds (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID        NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  phase          round_phase NOT NULL,
  order_index    INT         NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER rounds_updated_at
  BEFORE UPDATE ON public.rounds
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID         NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  round_id       UUID         NOT NULL REFERENCES public.rounds(id)       ON DELETE CASCADE,
  home_team_id   UUID         NOT NULL REFERENCES public.teams(id),
  away_team_id   UUID         NOT NULL REFERENCES public.teams(id),
  home_score     INT,
  away_score     INT,
  kickoff_at     TIMESTAMPTZ  NOT NULL,
  status         match_status NOT NULL DEFAULT 'upcoming',
  external_id    TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

CREATE OR REPLACE TRIGGER matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- predictions — one per user per match; locked at kickoff via RLS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.predictions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id      UUID        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  home_score    INT         NOT NULL CHECK (home_score >= 0),
  away_score    INT         NOT NULL CHECK (away_score >= 0),
  points_earned INT,
  locked_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);

CREATE OR REPLACE TRIGGER predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID        NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  owner_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  invite_code    TEXT        NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID        NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE OR REPLACE TRIGGER group_members_updated_at
  BEFORE UPDATE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- leaderboard_entries — computed server-side after each match is scored
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID        NOT NULL REFERENCES public.groups(id)       ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES auth.users(id)          ON DELETE CASCADE,
  competition_id UUID        NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  total_points   INT         NOT NULL DEFAULT 0,
  rank           INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE OR REPLACE TRIGGER leaderboard_entries_updated_at
  BEFORE UPDATE ON public.leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- scoring_configurations — data-driven points; never hardcode values in app
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scoring_configurations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id        UUID        NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  phase                 round_phase NOT NULL,
  exact_score_points    INT         NOT NULL,
  correct_result_points INT         NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, phase)
);

CREATE OR REPLACE TRIGGER scoring_configurations_updated_at
  BEFORE UPDATE ON public.scoring_configurations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
