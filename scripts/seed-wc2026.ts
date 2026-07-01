/**
 * Seed script: fetches WC 2026 teams + matches from worldcup26.ir (no auth required)
 * and upserts them into Supabase.
 *
 * Re-runnable — upserts on external_id, safe to run multiple times.
 *
 * Prerequisites:
 *   - Migrations 1–5 applied (supabase db push)
 *   - scripts/.env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Run: npm run seed
 */

import 'dotenv/config'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const SUPA_URL = process.env.SUPABASE_URL ?? ''
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPA_URL || !SUPA_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in scripts/.env')
  process.exit(1)
}

const wc26 = axios.create({ baseURL: 'https://worldcup26.ir' })
const supabase = createClient(SUPA_URL, SUPA_KEY)

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

interface WC26Team {
  id: string
  name_en: string
  fifa_code: string
  flag: string
}

interface WC26Match {
  id: string
  home_team_id: string   // "0" = TBD (knockout slot not yet determined)
  away_team_id: string
  home_score: string
  away_score: string
  group: string          // "A"–"L" for groups; stage label for knockout
  local_date: string     // "MM/DD/YYYY HH:MM" in the venue's local timezone
  finished: string       // "TRUE" | "FALSE"
  time_elapsed: string   // "notstarted" | "finished" | live duration
  type: string           // "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final"
  stadium_id: string
}

// ---------------------------------------------------------------------------
// Round mapping — matches Migration 5 deterministic UUIDs exactly
// ---------------------------------------------------------------------------

const GROUP_ROUND_IDS: Record<string, string> = {
  A: 'c0000000-0000-0000-0000-000000000001',
  B: 'c0000000-0000-0000-0000-000000000002',
  C: 'c0000000-0000-0000-0000-000000000003',
  D: 'c0000000-0000-0000-0000-000000000004',
  E: 'c0000000-0000-0000-0000-000000000005',
  F: 'c0000000-0000-0000-0000-000000000006',
  G: 'c0000000-0000-0000-0000-000000000007',
  H: 'c0000000-0000-0000-0000-000000000008',
  I: 'c0000000-0000-0000-0000-000000000009',
  J: 'c0000000-0000-0000-0000-000000000010',
  K: 'c0000000-0000-0000-0000-000000000011',
  L: 'c0000000-0000-0000-0000-000000000012',
}

const KNOCKOUT_ROUND_IDS: Record<string, string> = {
  r32:   'c0000000-0000-0000-0000-000000000013',
  r16:   'c0000000-0000-0000-0000-000000000014',
  qf:    'c0000000-0000-0000-0000-000000000015',
  sf:    'c0000000-0000-0000-0000-000000000016',
  third: 'c0000000-0000-0000-0000-000000000017',
  final: 'c0000000-0000-0000-0000-000000000018',
}

function getRoundId(m: WC26Match): string | null {
  if (m.type === 'group') return GROUP_ROUND_IDS[m.group] ?? null
  return KNOCKOUT_ROUND_IDS[m.type] ?? null
}

function mapStatus(m: WC26Match): 'upcoming' | 'live' | 'completed' {
  if (m.finished === 'TRUE') return 'completed'
  if (m.time_elapsed === 'notstarted') return 'upcoming'
  return 'live'
}

// Stadium → UTC offset during WC 2026 (June–July, full summer DST in North America)
const STADIUM_UTC_OFFSET: Record<string, number> = {
  '1':  -6,  // Estadio Azteca       — Mexico City  (CST, no DST since 2023)
  '2':  -6,  // Estadio Akron        — Guadalajara  (CST, no DST since 2023)
  '3':  -6,  // Estadio BBVA         — Monterrey    (CST, no DST since 2023)
  '4':  -5,  // AT&T Stadium         — Dallas       (CDT)
  '5':  -5,  // NRG Stadium          — Houston      (CDT)
  '6':  -5,  // Arrowhead            — Kansas City  (CDT)
  '7':  -4,  // Mercedes-Benz        — Atlanta      (EDT)
  '8':  -4,  // Hard Rock            — Miami        (EDT)
  '9':  -4,  // Gillette             — Boston       (EDT)
  '10': -4,  // Lincoln Financial    — Philadelphia (EDT)
  '11': -4,  // MetLife              — New York     (EDT)
  '12': -4,  // BMO Field            — Toronto      (EDT)
  '13': -7,  // BC Place             — Vancouver    (PDT)
  '14': -7,  // Lumen Field          — Seattle      (PDT)
  '15': -7,  // Levi's Stadium       — San Francisco(PDT)
  '16': -7,  // SoFi Stadium         — Los Angeles  (PDT)
}

// "MM/DD/YYYY HH:MM" + stadium_id → UTC ISO string
// Converts venue-local time to UTC so the frontend can display in the viewer's timezone
// via Intl.DateTimeFormat without any extra work.
function parseKickoff(localDate: string, stadiumId: string): string {
  const [datePart, timePart] = localDate.split(' ')
  const [mm, dd, yyyy] = datePart.split('/')
  const offset = STADIUM_UTC_OFFSET[stadiumId] ?? -6
  const sign = offset <= 0 ? '-' : '+'
  const abs = String(Math.abs(offset)).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${timePart}:00${sign}${abs}:00`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Fetch + upsert teams
  console.log('Fetching teams from worldcup26.ir…')
  const { data: teamsPayload } = await wc26.get<{ teams: WC26Team[] }>('/get/teams')
  const teams = teamsPayload.teams
  console.log(`  → ${teams.length} teams`)

  const { error: teamErr } = await supabase
    .from('teams')
    .upsert(
      teams.map(t => ({
        name:        t.name_en,
        short_name:  t.fifa_code,
        flag_url:    t.flag,
        external_id: `wc26_${t.id}`,
      })),
      { onConflict: 'external_id' },
    )

  if (teamErr) { console.error('Team upsert failed:', teamErr.message); process.exit(1) }
  console.log('  ✓ Teams upserted')

  // 2. Read UUIDs back so we can reference them in matches
  const { data: teamRows, error: teamFetchErr } = await supabase
    .from('teams')
    .select('id, external_id')
    .like('external_id', 'wc26_%')

  if (teamFetchErr || !teamRows) {
    console.error('Failed to fetch team UUIDs:', teamFetchErr?.message)
    process.exit(1)
  }

  const extToUuid = new Map(teamRows.map(r => [r.external_id as string, r.id as string]))

  // 3. Fetch + upsert matches
  console.log('\nFetching matches from worldcup26.ir…')
  const { data: matchesPayload } = await wc26.get<{ games: WC26Match[] }>('/get/games')
  const matches = matchesPayload.games
  console.log(`  → ${matches.length} matches`)

  const COMPETITION_ID = 'a0000000-0000-0000-0000-000000000001'
  let skipped = 0
  const rows: object[] = []

  for (const m of matches) {
    // Knockout slots that haven't been determined yet (team_id "0") — re-run seed to pick them up later
    if (m.home_team_id === '0' || m.away_team_id === '0') { skipped++; continue }

    const roundId = getRoundId(m)
    if (!roundId) { skipped++; continue }

    const homeId = extToUuid.get(`wc26_${m.home_team_id}`)
    const awayId = extToUuid.get(`wc26_${m.away_team_id}`)
    if (!homeId || !awayId) { skipped++; continue }

    const status = mapStatus(m)
    rows.push({
      competition_id: COMPETITION_ID,
      round_id:       roundId,
      home_team_id:   homeId,
      away_team_id:   awayId,
      home_score:     status === 'upcoming' ? null : Number(m.home_score),
      away_score:     status === 'upcoming' ? null : Number(m.away_score),
      kickoff_at:     parseKickoff(m.local_date, m.stadium_id),
      status,
      external_id:    `wc26_match_${m.id}`,
    })
  }

  console.log(`\nUpserting ${rows.length} matches (${skipped} skipped — TBD teams or unknown round)…`)

  for (let i = 0; i < rows.length; i += 50) {
    const { error: matchErr } = await supabase
      .from('matches')
      .upsert(rows.slice(i, i + 50), { onConflict: 'external_id' })

    if (matchErr) {
      console.error(`Match upsert failed (batch ${Math.floor(i / 50) + 1}):`, matchErr.message)
      process.exit(1)
    }
  }

  console.log('  ✓ Matches upserted')
  console.log('\nSeed complete.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
