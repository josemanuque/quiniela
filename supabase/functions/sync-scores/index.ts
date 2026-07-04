// sync-scores — Supabase Edge Function
//
// Fetches live/upcoming match data from worldcup26.ir and syncs scores + status
// to the database. Designed to be called on a cron schedule every 2 minutes.
//
// When a match transitions to 'completed' the scoring trigger in migration 9
// fires automatically to score all predictions for that match.
//
// Deploy:   supabase functions deploy sync-scores
// Schedule: Supabase Dashboard → Functions → Schedules → every 2 minutes

import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  type WC26Match,
  mapStatus,
  parseKickoff,
} from '../_shared/wc26.ts'

const WC26_BASE = 'https://worldcup26.ir'

interface WC26GamesResponse {
  games: WC26Match[]
}

Deno.serve(async (_req: Request): Promise<Response> => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    // 1. Fetch all games from worldcup26.ir
    const res = await fetch(`${WC26_BASE}/get/games`)
    if (!res.ok) throw new Error(`worldcup26.ir returned ${res.status}`)
    const { games } = await res.json() as WC26GamesResponse

    // 2. Build external_id → update payload map (skip TBD slots)
    const apiMap = new Map<string, {
      status: 'upcoming' | 'live' | 'completed'
      home_score: number | null
      away_score: number | null
      home_penalties: number | null
      away_penalties: number | null
      kickoff_at: string
    }>()

    for (const g of games) {
      if (g.home_team_id === '0' || g.away_team_id === '0') continue

      const status    = mapStatus(g)
      const kickoffAt = parseKickoff(g.local_date, g.stadium_id)

      const homePens = g.home_penalty_score ? parseInt(g.home_penalty_score, 10) : null
      const awayPens = g.away_penalty_score ? parseInt(g.away_penalty_score, 10) : null

      apiMap.set(`wc26_match_${g.id}`, {
        status,
        home_score:     status === 'upcoming' ? null : parseInt(g.home_score, 10),
        away_score:     status === 'upcoming' ? null : parseInt(g.away_score, 10),
        home_penalties: homePens,
        away_penalties: awayPens,
        kickoff_at:     kickoffAt,
      })
    }

    // 3. Fetch current DB state for non-completed matches (completed matches don't change)
    const { data: dbMatches, error: fetchErr } = await supabase
      .from('matches')
      .select('id, external_id, status, home_score, away_score, home_penalties, away_penalties')
      .like('external_id', 'wc26_match_%')
      .neq('status', 'completed')

    if (fetchErr) throw fetchErr

    // 4. Find changed matches and batch-update
    const toUpdate: Array<{
      id: string
      status: string
      home_score: number | null
      away_score: number | null
      home_penalties: number | null
      away_penalties: number | null
    }> = []

    for (const match of dbMatches ?? []) {
      const api = apiMap.get(match.external_id as string)
      if (!api) continue

      const changed =
        api.status         !== match.status         ||
        api.home_score     !== match.home_score     ||
        api.away_score     !== match.away_score     ||
        api.home_penalties !== match.home_penalties ||
        api.away_penalties !== match.away_penalties

      if (changed) {
        toUpdate.push({
          id:             match.id as string,
          status:         api.status,
          home_score:     api.home_score,
          away_score:     api.away_score,
          home_penalties: api.home_penalties,
          away_penalties: api.away_penalties,
        })
      }
    }

    if (toUpdate.length > 0) {
      // Update each changed match individually — we only update known DB rows,
      // so this is always an UPDATE, never an INSERT
      const updates = toUpdate.map(m =>
        supabase
          .from('matches')
          .update({
            status:         m.status,
            home_score:     m.home_score,
            away_score:     m.away_score,
            home_penalties: m.home_penalties,
            away_penalties: m.away_penalties,
          })
          .eq('id', m.id),
      )
      const results = await Promise.all(updates)
      const firstErr = results.find(r => r.error)?.error
      if (firstErr) throw firstErr
    }

    const result = {
      ok:      true,
      checked: dbMatches?.length ?? 0,
      updated: toUpdate.length,
      ts:      new Date().toISOString(),
    }

    console.log(`sync-scores: checked=${result.checked} updated=${result.updated}`)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('sync-scores error:', msg, err)
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
