import { supabase } from '@/lib/supabaseClient'
import type { Json } from '@/types/database.types'
import type { NotificationPreferences } from '../types/notification.types'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const array = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; i++) {
    array[i] = rawData.charCodeAt(i)
  }
  return array
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export const notificationService = {
  isSupported(): boolean {
    return 'Notification' in window && 'PushManager' in window && 'serviceWorker' in navigator
  },

  getPermission(): NotificationPermission {
    return Notification.permission
  },

  async getCurrentSubscription(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.ready
    return registration.pushManager.getSubscription()
  },

  async subscribe(): Promise<PushSubscription> {
    if (Notification.permission !== 'granted') {
      const result = await Notification.requestPermission()
      if (result !== 'granted') throw new Error('Permission denied')
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const userId = await getCurrentUserId()
    const json = subscription.toJSON() as unknown as Json

    const { error: subError } = await supabase
      .from('push_subscriptions')
      .upsert(
        { user_id: userId, endpoint: subscription.endpoint, subscription: json },
        { onConflict: 'user_id,endpoint' }
      )
    if (subError) throw subError

    // Default all preferences to true on first subscribe
    const { error: prefError } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, enabled: true, daily: true, pre_1h: true, pre_5m: true })
    if (prefError) throw prefError

    return subscription
  },

  async unsubscribe(): Promise<void> {
    const subscription = await notificationService.getCurrentSubscription()
    if (!subscription) return

    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  },

  async getPreferences(): Promise<NotificationPreferences | null> {
    const { data } = await supabase
      .from('notification_preferences')
      .select('enabled, daily, pre_1h, pre_5m')
      .maybeSingle()
    return data
  },

  async savePreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() })
    if (error) throw error
  },
}
