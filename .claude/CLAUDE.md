# Quiniela

This is a production-quality football prediction web application focused on the FIFA World Cup and future football competitions.

Primary goals:

- Excellent mobile-first experience.
- Simple and intuitive UX.
- Fast performance.
- Scalable architecture.
- Clean code.
- Excellent TypeScript practices.

Technology Stack

Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Router
- TanStack Query

Backend

- Supabase
- PostgreSQL
- Google Authentication
- Realtime
- Football Data Provider

Hosting

- Vercel
- Supabase

Read every file under `.claude/skills` before making architectural decisions.

Never violate the established architecture.

Prefer incremental improvements over large rewrites.

Keep the MVP simple while designing for future scalability.

# Project Context: Quiniela MVP

## Architecture & Data Flow
- Stack: React + Vite + TS, Tailwind, shadcn/ui, TanStack Query, TanStack Router, Supabase.
- Folder Layout: Feature-based. Code resides in `src/features/[feature-name]/` (components, hooks, services, types, utils) before moving to global `src/` folders.
- Rule: Pages/UI components must NEVER import `supabaseClient` or execute DB queries directly. 
- Abstraction: All backend interactions must execute via pure TypeScript services (e.g., `matchService.ts`) to isolate Supabase from the UI.
- State: Local State > Context (Auth/Global UI only) > TanStack Query (Server State). No Redux.

## Naming & Domain Language
- Allowed Domain Words: Competition, Round, Match, Team, Prediction, Group, GroupMember, Leaderboard, ScoringConfiguration, User.
- Forbidden Words: Game, Fixture, Bet, Pick, Guess, Lobby, League, Room.
- Entities must be singular (e.g., `Match`).
- Case Styles: Components (PascalCase), Hooks (camelCase with `use`), Services/Utils (camelCase + `Service`/`Utils` suffix).

## Database & Supabase
- Source of truth: PostgreSQL. Every table requires a UUID primary key, `created_at`, and `updated_at`.
- Security: Row Level Security (RLS) is mandatory on all tables. Frontend client uses `anon` key only. Never expose `service_role`.
- Authentication: Handled exclusively via Supabase Google OAuth. No passwords.
- Realtime: Enable Supabase Realtime *only* for Leaderboards, Live Match scores, and Prediction blocks.

## External Football API
- React must never call the external Football API.
- Flow: Football API → Server-side abstraction (`FootballProvider` interface) → Database sync → Frontend.
- Syncing: Run via a single server-side background process. No client-side polling. 
- Live Polling: Backend process polls every 30-60s *only* during live matches.
- Prediction Lock: Read-only exactly at kickoff based on Server/API time.

## Scoring System
- Points and multipliers must be completely data-driven.
- Load constraints from the database `ScoringConfiguration` table per tournament phase. Do not hardcode numbers (5, 3, 2, 1) in the application layer.

## UI Style
- Mobile-first, dark-mode first dashboard layout resembling SofaScore/Flashscore.
- Tables: Animate leaderboard ranking shifts and highlight score updates.