---
name: db-migrate
description: Use when creating or modifying database schema, tables, relationships, or Row Level Security (RLS) policies.
---

# Database Migration Procedure

This skill manages production-grade schema progression for the Supabase PostgreSQL database. Always follow these steps linearly.

## Step 1: Analysis & Inventory
1. Scan the contents of `supabase/migrations/` to find the highest lexicographical prefix timestamp.
2. Check if the proposed change alters columns utilized by the real-time scoring rules or leaderboards.

## Step 2: Idempotent Generation
Create a new file under `supabase/migrations/[TIMESTAMP]_migration_name.sql` applying these strict constraints:
- Tables must use `IF NOT EXISTS` rules.
- Columns must use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
- Assign clear constraints (e.g., `NOT NULL`, foreign key Cascades, UUID default values via `gen_random_uuid()`).

## Step 3: Security Triggers (Mandatory)
Every table generated requires explicit Row Level Security initialization. Append this chunk block to the bottom of the SQL document:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated group members" 
ON table_name FOR SELECT 
TO authenticated 
USING (true);