// send-notifications — Supabase Edge Function
//
// Runs every 5 minutes via cron. Handles three notification triggers:
//   • 5-min reminder  — match kicks off in 5–10 min, user has no prediction
//   • 1-hr reminder   — match kicks off in 58–63 min, user has no prediction
//   • daily reminder  — fires once at 8am UTC or 2 hrs before first match of
//                       the day (whichever is earlier), user has missing picks
//
// Deploy:   supabase functions deploy send-notifications
// Schedule: Supabase Dashboard → Functions → Schedules → every 5 minutes
// Secrets:  supabase secrets set VAPID_PUBLIC_KEY=<pub> VAPID_PRIVATE_KEY=<priv>

import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const VAPID_SUBJECT  = 'mailto:josemanuque@gmail.com'
const VAPID_PUBLIC   = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE  = Deno.env.get('VAPID_PRIVATE_KEY')!

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

interface MatchRow {
  id: string
  kickoff_at: string
  home_team: { name: string }
  away_team: { name: string }
}

interface SubRow {
  subscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
}

type NotifType = 'pre_5m' | 'pre_1h' | 'daily'

async function getMatchesInWindow(
  supabase: ReturnType<typeof createClient>,
  fromMin: number,
  toMin: number,
): Promise<MatchRow[]> {
  const now = new Date()
  const from = new Date(now.getTime() + fromMin * 60_000).toISOString()
  const to   = new Date(now.getTime() + toMin   * 60_000).toISOString()

  const { data, error } = await supabase
    .from('matches')
    .select('id, kickoff_at, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
    .eq('status', 'upcoming')
    .gte('kickoff_at', from)
    .lte('kickoff_at', to)

  if (error) throw error
  return (data ?? []) as unknown as MatchRow[]
}

async function getSubscribersForMatch(
  supabase: ReturnType<typeof createClient>,
  matchId: string,
  notifType: 'pre_5m' | 'pre_1h',
): Promise<SubRow[]> {
  // Users who have a subscription + pref enabled (or no pref row = default true)
  // and have NOT predicted this specific match
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select(`
      subscription,
      profiles!inner(id),
      notification_preferences(enabled, ${notifType})
    `)
    .filter('notification_preferences.enabled', 'not.eq', false)
    .filter(`notification_preferences.${notifType}`, 'not.eq', false)

  if (error) throw error

  // Filter out users who already have a prediction
  const rows = (data ?? []) as Array<{
    subscription: SubRow['subscription']
    profiles: { id: string }
    notification_preferences: { enabled: boolean; pre_5m?: boolean; pre_1h?: boolean } | null
  }>

  // Collect user IDs to check
  const userIds = rows.map((r) => r.profiles.id)
  if (userIds.length === 0) return []

  const { data: preds } = await supabase
    .from('predictions')
    .select('user_id')
    .eq('match_id', matchId)
    .in('user_id', userIds)

  const predictedSet = new Set((preds ?? []).map((p: { user_id: string }) => p.user_id))

  return rows
    .filter((r) => {
      const np = r.notification_preferences
      // Default true when no preference row
      if (np === null) return !predictedSet.has(r.profiles.id)
      if (np.enabled === false) return false
      if (notifType === 'pre_5m' && np.pre_5m === false) return false
      if (notifType === 'pre_1h' && np.pre_1h === false) return false
      return !predictedSet.has(r.profiles.id)
    })
    .map((r) => ({ subscription: r.subscription }))
}

async function getDailySubscribers(
  supabase: ReturnType<typeof createClient>,
): Promise<SubRow[]> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select(`
      subscription,
      profiles!inner(id),
      notification_preferences(enabled, daily)
    `)

  if (error) throw error

  const rows = (data ?? []) as Array<{
    subscription: SubRow['subscription']
    profiles: { id: string }
    notification_preferences: { enabled: boolean; daily: boolean } | null
  }>

  const userIds = rows.map((r) => r.profiles.id)
  if (userIds.length === 0) return []

  // Find users who have at least one upcoming match today with no prediction
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayEnd   = new Date(todayStart.getTime() + 86_400_000)

  const { data: todayMatches } = await supabase
    .from('matches')
    .select('id')
    .eq('status', 'upcoming')
    .gte('kickoff_at', todayStart.toISOString())
    .lt('kickoff_at', todayEnd.toISOString())

  if (!todayMatches || todayMatches.length === 0) return []
  const matchIds = todayMatches.map((m: { id: string }) => m.id)

  const { data: preds } = await supabase
    .from('predictions')
    .select('user_id, match_id')
    .in('match_id', matchIds)
    .in('user_id', userIds)

  // Per user: which match IDs they've predicted
  const userPredMap = new Map<string, Set<string>>()
  for (const p of preds ?? []) {
    const pr = p as { user_id: string; match_id: string }
    if (!userPredMap.has(pr.user_id)) userPredMap.set(pr.user_id, new Set())
    userPredMap.get(pr.user_id)!.add(pr.match_id)
  }

  return rows
    .filter((r) => {
      const np = r.notification_preferences
      if (np !== null) {
        if (np.enabled === false || np.daily === false) return false
      }
      // Has at least one upcoming match today without a prediction
      const predicted = userPredMap.get(r.profiles.id)
      return matchIds.some((mid: string) => !predicted?.has(mid))
    })
    .map((r) => ({ subscription: r.subscription }))
}

async function sendPush(
  sub: SubRow['subscription'],
  payload: { title: string; body: string; url: string; tag: string },
) {
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload))
  } catch (err) {
    // 410 = subscription expired — log but don't throw (will be cleaned up later)
    const status = (err as { statusCode?: number }).statusCode
    if (status !== 410 && status !== 404) throw err
    console.warn('Expired subscription, skipping:', sub.endpoint?.slice(0, 60))
  }
}

function isDailyWindow(): boolean {
  // Returns true if current UTC time is within the 5-min window for daily trigger.
  // Trigger = min(noon UTC [12:00], 2h before first match of the day)
  // We compare against noon UTC as a fixed daily baseline when no match is imminent.
  // The caller (main handler) passes first-match info separately.
  const now  = new Date()
  const noon = new Date(now)
  noon.setUTCHours(12, 0, 0, 0)
  const diffMs = now.getTime() - noon.getTime()
  // Within 0..5 min after noon UTC
  return diffMs >= 0 && diffMs < 5 * 60_000
}

async function getFirstMatchTrigger(
  supabase: ReturnType<typeof createClient>,
): Promise<Date | null> {
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart.getTime() + 86_400_000)

  const { data } = await supabase
    .from('matches')
    .select('kickoff_at')
    .eq('status', 'upcoming')
    .gte('kickoff_at', todayStart.toISOString())
    .lt('kickoff_at', todayEnd.toISOString())
    .order('kickoff_at', { ascending: true })
    .limit(1)

  if (!data || data.length === 0) return null
  const firstKickoff = new Date((data[0] as { kickoff_at: string }).kickoff_at)
  return new Date(firstKickoff.getTime() - 2 * 60 * 60_000) // 2 hrs before
}

Deno.serve(async (_req: Request): Promise<Response> => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const results: Record<NotifType, { matches: number; sent: number }> = {
    pre_5m: { matches: 0, sent: 0 },
    pre_1h: { matches: 0, sent: 0 },
    daily:  { matches: 0, sent: 0 },
  }

  try {
    // ── 1. 5-min reminder ────────────────────────────────────────────────────
    const matches5m = await getMatchesInWindow(supabase, 5, 10)
    results.pre_5m.matches = matches5m.length
    for (const match of matches5m) {
      const subs = await getSubscribersForMatch(supabase, match.id, 'pre_5m')
      await Promise.all(
        subs.map((s) =>
          sendPush(s.subscription, {
            title: `⏱️ ${match.home_team.name} vs ${match.away_team.name}`,
            body:  'Kickoff in 5 minutes — submit your pick now!',
            url:   '/app/matches',
            tag:   `pre5m-${match.id}`,
          })
        ),
      )
      results.pre_5m.sent += subs.length
    }

    // ── 2. 1-hr reminder ─────────────────────────────────────────────────────
    const matches1h = await getMatchesInWindow(supabase, 58, 63)
    results.pre_1h.matches = matches1h.length
    for (const match of matches1h) {
      const subs = await getSubscribersForMatch(supabase, match.id, 'pre_1h')
      await Promise.all(
        subs.map((s) =>
          sendPush(s.subscription, {
            title: `🎯 ${match.home_team.name} vs ${match.away_team.name}`,
            body:  'Pick your score — match starts in 1 hour!',
            url:   '/app/matches',
            tag:   `pre1h-${match.id}`,
          })
        ),
      )
      results.pre_1h.sent += subs.length
    }

    // ── 3. Daily reminder ────────────────────────────────────────────────────
    const now = new Date()
    const triggerTime = await getFirstMatchTrigger(supabase)
    const noonUtc = new Date(now)
    noonUtc.setUTCHours(12, 0, 0, 0)

    // Pick the earlier of noon UTC or 2h-before-first-match
    const dailyTrigger = triggerTime && triggerTime < noonUtc ? triggerTime : noonUtc

    const diffMs = now.getTime() - dailyTrigger.getTime()
    const inDailyWindow = diffMs >= 0 && diffMs < 5 * 60_000

    if (inDailyWindow) {
      const subs = await getDailySubscribers(supabase)
      await Promise.all(
        subs.map((s) =>
          sendPush(s.subscription, {
            title: '📅 Quiniela Reminder',
            body:  "Don't forget — fill in today's predictions before kickoff!",
            url:   '/app/matches',
            tag:   `daily-${now.toISOString().slice(0, 10)}`,
          })
        ),
      )
      results.daily.sent = subs.length
      results.daily.matches = 1
    }

    console.log('send-notifications:', JSON.stringify(results))
    return new Response(JSON.stringify({ ok: true, ...results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('send-notifications error:', msg)
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 })
  }
})
