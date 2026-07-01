-- =============================================================================
-- Migration: Add missing round_phase enum values for WC 2026 format
-- WC 2026 expanded to 48 teams: 12 groups → Round of 32 (new) → Round of 16 → …
-- Also adds third_place playoff phase
-- =============================================================================

-- Note: ALTER TYPE ADD VALUE is safe inside a transaction in PostgreSQL 12+
ALTER TYPE round_phase ADD VALUE IF NOT EXISTS 'round_of_32' BEFORE 'round_of_16';
ALTER TYPE round_phase ADD VALUE IF NOT EXISTS 'third_place' BEFORE 'final';
