import { NextResponse } from 'next/server'
import { createSupabaseContext } from '@/lib/supabase/context'
import { getUserSubscription } from '@/lib/subscription'

// ── Recent stance changes ─────────────────────────────────
// Powers the "What changed" strip on the dashboard. signal_history is
// already appended to on every refresh, so this is a read of data we
// collect anyway — no extra generation cost.

const WINDOW_HOURS = 24

type HistoryRow = {
  ticker: string
  signal_type: string
  previous_type: string | null
  price: number | string
  generated_at: string
}

export async function GET() {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { live } = await getUserSubscription(ctx.supabase, ctx.userClaims!.id)
  if (!live) {
    return NextResponse.json({ error: 'Subscription required', code: 'NO_SUBSCRIPTION' }, { status: 403 })
  }

  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  const { data: history, error } = await ctx.supabaseAdmin
    .from('signal_history')
    .select('ticker, signal_type, previous_type, price, generated_at')
    .gt('generated_at', since)
    .order('generated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Latest price per ticker, so a change can show how it's moved since.
  const { data: current } = await ctx.supabaseAdmin
    .from('signals')
    .select('ticker, price')
    .gt('expires_at', new Date().toISOString())
  const priceNow = new Map((current ?? []).map(r => [r.ticker as string, Number(r.price)]))

  // A ticker can flip more than once in the window; keep only its most
  // recent change, and drop first-sightings (previous_type null) — "new
  // coin added" isn't a change the reader can act on.
  const seen = new Set<string>()
  const changes = ((history ?? []) as HistoryRow[])
    .filter(h => {
      if (!h.previous_type || seen.has(h.ticker)) return false
      seen.add(h.ticker)
      return true
    })
    .map(h => {
      const at = Number(h.price)
      const now = priceNow.get(h.ticker) ?? null
      return {
        ticker: h.ticker,
        signal_type: h.signal_type,
        previous_type: h.previous_type,
        price_at_change: at,
        current_price: now,
        change_pct: now && at > 0 ? ((now / at) - 1) * 100 : null,
        generated_at: h.generated_at,
      }
    })

  return NextResponse.json({ changes, window_hours: WINDOW_HOURS })
}
