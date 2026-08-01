import type { SupabaseClient } from '@supabase/supabase-js'

// ── Subscription lookup ───────────────────────────────────
// A user can legitimately end up with more than one row here: when a renewal
// fails the old Stripe subscription stays behind as past_due and subscribing
// again creates a brand-new one rather than reviving it. Reading that with
// `.single()` throws (PGRST116, "multiple rows returned"), which silently
// reads as "no subscription" and locks a paying account out of the app — so
// every caller goes through this helper instead.

export interface SubscriptionRow {
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: string | null
  status: string | null
  current_period_end: string | null
  created_at: string | null
}

const LIVE_STATUSES = ['active', 'trialing']

// Stripe renews a subscription at the instant the period ends, but our row
// only catches up when the webhook lands. Treating the old period end as
// expiry made that gap look like "not subscribed": a real renewal at
// 00:02:11 left the account locked out at 00:18, sent to the subscribe page,
// and — because the duplicate-purchase guard reads this same value — allowed
// two more subscriptions to be created and charged.
//
// Status is what Stripe actually asserts: a failed payment moves it to
// past_due or unpaid, and a cancellation to canceled. So while status is
// live, a lapsed period end means the webhook is behind, not that access
// should stop. The window is generous on purpose — the cost of holding
// access a bit too long is far lower than charging someone twice.
const RENEWAL_GRACE_MS = 72 * 60 * 60 * 1000

export interface UserSubscription {
  /** Every row for the user, newest period end first. */
  rows: SubscriptionRow[]
  /** The row granting access right now, if any. */
  live: SubscriptionRow | null
  /** Most recent row regardless of status — used to reuse the Stripe customer. */
  latest: SubscriptionRow | null
}

export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, created_at')
    .eq('user_id', userId)
    .order('current_period_end', { ascending: false, nullsFirst: false })

  if (error) console.error('Subscription lookup error:', error)

  const rows = (data ?? []) as SubscriptionRow[]
  const now = Date.now()

  const live = rows.find(r =>
    LIVE_STATUSES.includes(r.status ?? '') &&
    // No period end recorded yet (a brand-new row awaiting its first
    // webhook) still counts as live — Stripe already took the money.
    (!r.current_period_end ||
      new Date(r.current_period_end).getTime() + RENEWAL_GRACE_MS > now)
  ) ?? null

  return { rows, live, latest: rows[0] ?? null }
}
