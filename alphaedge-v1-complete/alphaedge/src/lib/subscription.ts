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
    !!r.current_period_end &&
    new Date(r.current_period_end).getTime() > now
  ) ?? null

  return { rows, live, latest: rows[0] ?? null }
}
