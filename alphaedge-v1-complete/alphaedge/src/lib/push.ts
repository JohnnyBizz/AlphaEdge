import webpush from 'web-push'
import { createAdminClient } from './supabase/admin'

// ── Web push delivery ─────────────────────────────────────
// Sending is best-effort: a failed notification must never break the job
// that triggered it. Endpoints the browser has retired are pruned as we go,
// otherwise the table fills with subscriptions that can never be delivered.

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const CONTACT = process.env.VAPID_CONTACT ?? 'mailto:alerts@alphaedge.network'

export function pushConfigured() {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY)
}

let configured = false
function ensureConfigured() {
  if (configured || !pushConfigured()) return
  webpush.setVapidDetails(CONTACT, PUBLIC_KEY!, PRIVATE_KEY!)
  configured = true
}

export interface PushMessage {
  title: string
  body: string
  url?: string
  /** Notifications sharing a tag replace each other instead of stacking. */
  tag?: string
}

interface SubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Sends one message to every device belonging to the given users.
 * Returns how many were delivered; never throws.
 */
export async function sendPushToUsers(userIds: string[], message: PushMessage): Promise<number> {
  if (!pushConfigured() || userIds.length === 0) return 0
  ensureConfigured()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (error) {
    console.error('Push subscription lookup failed:', error)
    return 0
  }

  const subs = (data ?? []) as SubscriptionRow[]
  if (subs.length === 0) return 0

  const payload = JSON.stringify(message)
  const expired: string[] = []
  let sent = 0

  await Promise.all(subs.map(async sub => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      )
      sent++
    } catch (err: any) {
      // 404/410 mean the browser dropped this subscription for good — the
      // user cleared site data or uninstalled. Anything else is transient.
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        expired.push(sub.id)
      } else {
        console.error('Push send failed:', err?.statusCode, err?.body ?? err?.message)
      }
    }
  }))

  if (expired.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expired)
  }

  return sent
}
