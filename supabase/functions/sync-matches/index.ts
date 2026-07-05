// sync-matches — Supabase Edge Function
//
// 1. Creates new match records as knockout teams get determined.
// 2. Creates TBD matches (team = 0) with labels like "Winner Match 93".
// 3. Resolves TBD slots hourly: when a referenced match completes, updates
//    the null home_team_id / away_team_id with the actual winner's team ID.
//
// Deploy:   supabase functions deploy sync-matches
// Schedule: Supabase Dashboard → Functions → Schedules → every 1 hour

import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  type WC26Match,
  mapStatus,
  parseKickoff,
  getRoundId,
} from '../_shared/wc26.ts'

const WC26_BASE      = 'https://worldcup26.ir'
const COMPETITION_ID = 'a0000000-0000-0000-0000-000000000001'

interface WC26GamesResponse {
  games: WC26Match[]
}

// Parse "Winner Match 93" → { outcome: 'winner', apiId: '93' }
//       "Loser Match 93"  → { outcome: 'loser',  apiId: '93' }
function parseLabel(label: string | null | undefined): { outcome: 'winner' | 'loser'; apiId: string } | null {
  if (!label) return null
  const m = label.match(/^(Winner|Loser) Match (\d+)$/i)
  if (!m) return null
  return { outcome: m[1].toLowerCase() as 'winner' | 'loser', apiId: m[2] }
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
    // ── 1. Fetch all games ───────────────────────────────────────────────────
    const res = await fetch(`${WC26_BASE}/get/games`)
    if (!res.ok) throw new Error(`worldcup26.ir returned ${res.status}`)
    const { games } = await res.json() as WC26GamesResponse

    // ── 2. Load team lookup: wc26_N → DB UUID ───────────────────────────────
    const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('id, short_name, external_id')
      .not('external_id', 'is', null)
    if (teamsErr) throw teamsErr

    const teamMap      = new Map<string, string>() // wc26_N → db uuid
    const teamShortMap = new Map<string, string>() // db uuid → short_name
    for (const t of teams ?? []) {
      teamMap.set(t.external_id as string, t.id as string)
      teamShortMap.set(t.id as string, t.short_name as string)
    }

    // ── 3. Load existing matches ─────────────────────────────────────────────
    const { data: existing, error: existErr } = await supabase
      .from('matches')
      .select('id, external_id, home_team_id, away_team_id, home_team_label, away_team_label, home_score, away_score, home_penalties, away_penalties, status')
      .like('external_id', 'wc26_match_%')
    if (existErr) throw existErr

    const existingIds  = new Set((existing ?? []).map((m) => m.external_id as string))
    // Map external_id → full row (for winner resolution and smart labels)
    const existingById = new Map((existing ?? []).map((m) => [m.external_id as string, m]))

    // Build "wc26_match_N" → "BRA / NOR" short-name display for TBD labels
    function smartLabel(rawLabel: string | null | undefined): string | null {
      if (!rawLabel) return null
      const parsed = parseLabel(rawLabel)
      if (!parsed) return rawLabel
      const ref = existingById.get(`wc26_match_${parsed.apiId}`)
      if (!ref) return rawLabel
      const homeShort = ref.home_team_id ? teamShortMap.get(ref.home_team_id as string) : null
      const awayShort = ref.away_team_id ? teamShortMap.get(ref.away_team_id as string) : null
      if (homeShort && awayShort) return `${homeShort} / ${awayShort}`
      return rawLabel
    }

    // ── 4. Upsert new matches (both real teams and TBD) ──────────────────────
    const toInsert: object[] = []

    for (const g of games) {
      const externalId = `wc26_match_${g.id}`
      if (existingIds.has(externalId)) continue // already in DB

      const roundId = getRoundId(g)
      if (!roundId) continue

      const isTbd  = g.home_team_id === '0' || g.away_team_id === '0'
      const status = mapStatus(g)
      const kickoffAt = parseKickoff(g.local_date, g.stadium_id)

      if (isTbd) {
        // Create with null team IDs + smart labels ("BRA / NOR" when possible)
        toInsert.push({
          external_id:     externalId,
          competition_id:  COMPETITION_ID,
          round_id:        roundId,
          home_team_id:    null,
          away_team_id:    null,
          home_team_label: smartLabel(g.home_team_label),
          away_team_label: smartLabel(g.away_team_label),
          kickoff_at:      kickoffAt,
          status:          'upcoming',
        })
      } else {
        const homeDbId = teamMap.get(`wc26_${g.home_team_id}`)
        const awayDbId = teamMap.get(`wc26_${g.away_team_id}`)
        if (!homeDbId || !awayDbId) {
          console.warn(`sync-matches: unknown team — home=${g.home_team_id} away=${g.away_team_id}`)
          continue
        }
        toInsert.push({
          external_id:     externalId,
          competition_id:  COMPETITION_ID,
          round_id:        roundId,
          home_team_id:    homeDbId,
          away_team_id:    awayDbId,
          home_team_label: null,
          away_team_label: null,
          kickoff_at:      kickoffAt,
          status,
          home_score:      status !== 'upcoming' ? parseInt(g.home_score, 10) : null,
          away_score:      status !== 'upcoming' ? parseInt(g.away_score, 10) : null,
          home_penalties:  g.home_penalty_score ? parseInt(g.home_penalty_score, 10) : null,
          away_penalties:  g.away_penalty_score ? parseInt(g.away_penalty_score, 10) : null,
        })
      }
    }

    let created = 0
    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase.from('matches').insert(toInsert)
      if (insertErr) throw insertErr
      created = toInsert.length
    }

    // ── 5a. Update labels on existing TBD matches when referenced teams are known ──
    for (const match of existing ?? []) {
      if (match.home_team_id !== null && match.away_team_id !== null) continue // already resolved

      const labelUpdates: { home_team_label?: string | null; away_team_label?: string | null } = {}

      for (const side of ['home', 'away'] as const) {
        if (match[`${side}_team_id`] !== null) continue // this side resolved already
        const raw     = match[`${side}_team_label`] as string | null
        const smarter = smartLabel(raw)
        if (smarter && smarter !== raw) labelUpdates[`${side}_team_label`] = smarter
      }

      if (Object.keys(labelUpdates).length > 0) {
        await supabase.from('matches').update(labelUpdates).eq('id', match.id as string)
      }
    }

    // ── 5b. Resolve TBD team slots from completed referenced matches ─────────
    // Re-fetch after inserts so newly created TBD rows are included
    const { data: tbdMatches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, home_team_label, away_team_label')
      .like('external_id', 'wc26_match_%')
      .or('home_team_id.is.null,away_team_id.is.null')

    let resolved = 0

    for (const match of tbdMatches ?? []) {
      const updates: { home_team_id?: string; away_team_id?: string } = {}

      for (const side of ['home', 'away'] as const) {
        const teamId = match[`${side}_team_id`] as string | null
        if (teamId !== null) continue // already resolved

        const label   = match[`${side}_team_label`] as string | null
        const parsed  = parseLabel(label)
        if (!parsed) continue

        const refExtId  = `wc26_match_${parsed.apiId}`
        const refMatch  = existingById.get(refExtId)
        if (!refMatch || refMatch.status !== 'completed') continue
        if (refMatch.home_score == null || refMatch.away_score == null) continue

        // Determine winner or loser
        const homeScore = refMatch.home_score as number
        const awayScore = refMatch.away_score as number
        const homePens  = refMatch.home_penalties as number | null
        const awayPens  = refMatch.away_penalties as number | null

        let winnerId: string | null = null
        let loserId:  string | null = null

        if (homeScore !== awayScore) {
          winnerId = homeScore > awayScore
            ? refMatch.home_team_id as string
            : refMatch.away_team_id as string
          loserId  = homeScore > awayScore
            ? refMatch.away_team_id as string
            : refMatch.home_team_id as string
        } else if (homePens != null && awayPens != null) {
          winnerId = homePens > awayPens
            ? refMatch.home_team_id as string
            : refMatch.away_team_id as string
          loserId  = homePens > awayPens
            ? refMatch.away_team_id as string
            : refMatch.home_team_id as string
        }

        const resolvedId = parsed.outcome === 'winner' ? winnerId : loserId
        if (resolvedId) updates[`${side}_team_id`] = resolvedId
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from('matches')
          .update(updates)
          .eq('id', match.id as string)
        if (updateErr) console.error('resolve update error', match.id, updateErr)
        else resolved++
      }
    }

    const result = {
      ok: true,
      created,
      resolved,
      ts: new Date().toISOString(),
    }

    console.log(`sync-matches: created=${created} resolved=${resolved}`)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('sync-matches error:', msg)
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
