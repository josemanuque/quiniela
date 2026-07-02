// send-test-notification — Supabase Edge Function
//
// Sends a test push notification to a specific user (or all subscribers).
// Call manually to verify the push pipeline end-to-end.
//
// Deploy: supabase functions deploy send-test-notification
//
// Usage (via supabase CLI):
//   supabase functions invoke send-test-notification \
//     --body '{"user_id":"<uuid>","title":"Test","body":"It works!"}'
//
// Omit user_id to send to ALL subscribers (use with care).

import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const VAPID_SUBJECT = 'https://quiniela.vercel.ap'
const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

Deno.serve(async (req: Request): Promise<Response> => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500 })
  }

  let body: { user_id?: string; title?: string; body?: string; url?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    body = {}
  }

  const title  = body.title ?? '👋 Quiniela'
  const message = body.body  ?? 'Push notifications are working!'
  const url    = body.url   ?? '/app/matches'

  const supabase = createClient(supabaseUrl, serviceKey)

  let query = supabase.from('push_subscriptions').select('subscription')
  if (body.user_id) query = query.eq('user_id', body.user_id)

  const { data, error } = await query
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  if (!data || data.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'No subscriptions found' }), {
      status: 404,
    })
  }

  let sent = 0
  const errors: string[] = []

  await Promise.all(
    data.map(async (row: { subscription: { endpoint: string; keys: { p256dh: string; auth: string } } }) => {
      try {
        await webpush.sendNotification(row.subscription, JSON.stringify({ title, body: message, url, tag: 'test' }))
        sent++
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err))
      }
    }),
  )

  return new Response(JSON.stringify({ ok: true, sent, errors }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
