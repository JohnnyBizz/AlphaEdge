import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUsers, pushConfigured } from '@/lib/push'

// ── Buy-in zone alerts ────────────────────────────────────
// Every card names a "buy-in zone to watch" and, until now, nothing watched
// it. This closes that: when an asset crosses into its zone, the people
// holding it get told.
//
// Deliberately scoped to assets a user actually holds a position in. Around
// 21 of 46 coins sit inside their zone at any given moment, so alerting on
// all of them would be unusable noise rather than a signal.

function fmt(p: number) {
  if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (p >= 1) return `$${p.toFixed(2)}`
  if (p >= 0.01) return `$${p.toFixed(4)}`
  return p > 0 ? `$${p.toPrecision(3)}` : '$0'
}

type SignalRow = {
  ticker: string
  price: number | string
  entry_low: number | string | null
  entry_high: number | string | null
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!pushConfigured()) {
    return NextResponse.json({ sent: 0, skipped: 'push not configured' })
  }

  const supabase = createAdminClient()

  const { data: signals } = await supabase
    .from('signals')
    .select('ticker, price, entry_low, entry_high')
    .gt('expires_at', new Date().toISOString())
  if (!signals || signals.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 'no live signals' })
  }

  // Current in-zone state per ticker.
  const now = new Map<string, { inZone: boolean; price: number; low: number; high: number }>()
  for (const s of signals as SignalRow[]) {
    const price = Number(s.price)
    const low = s.entry_low == null ? NaN : Number(s.entry_low)
    const high = s.entry_high == null ? NaN : Number(s.entry_high)
    if (!Number.isFinite(price) || !Number.isFinite(low) || !Number.isFinite(high)) continue
    now.set(s.ticker, { inZone: price >= low && price <= high, price, low, high })
  }

  const { data: prev } = await supabase.from('zone_state').select('ticker, in_zone')
  const wasInZone = new Map<string, boolean>(
    (prev ?? []).map(r => [r.ticker as string, r.in_zone as boolean]),
  )

  // Only the crossing counts. A coin that has been sitting in its zone for
  // days is not news, and a ticker with no prior state is recorded silently
  // so the first run after deployment doesn't alert on everything at once.
  const entered = Array.from(now.entries())
    .filter(([ticker, cur]) => cur.inZone && wasInZone.get(ticker) === false)
    .map(([ticker, cur]) => ({ ticker, ...cur }))

  // Persist current state regardless of whether anything was sent.
  const rows = Array.from(now.entries()).map(([ticker, cur]) => ({
    ticker, in_zone: cur.inZone, updated_at: new Date().toISOString(),
  }))
  if (rows.length > 0) {
    const { error } = await supabase.from('zone_state').upsert(rows, { onConflict: 'ticker' })
    if (error) console.error('zone_state upsert failed:', error)
  }

  if (entered.length === 0) {
    return NextResponse.json({ sent: 0, tracked: rows.length, entered: 0 })
  }

  // Who holds these tickers?
  const { data: holders } = await supabase
    .from('positions')
    .select('user_id, ticker')
    .in('ticker', entered.map(e => e.ticker))

  const byTicker = new Map<string, string[]>()
  for (const h of holders ?? []) {
    const list = byTicker.get(h.ticker as string) ?? []
    if (!list.includes(h.user_id as string)) list.push(h.user_id as string)
    byTicker.set(h.ticker as string, list)
  }

  let sent = 0
  const notified: string[] = []
  for (const e of entered) {
    const users = byTicker.get(e.ticker) ?? []
    if (users.length === 0) continue
    const delivered = await sendPushToUsers(users, {
      title: `${e.ticker} reached its buy-in zone`,
      body: `${fmt(e.price)} — inside the ${fmt(e.low)}–${fmt(e.high)} zone the analysis flagged. Educational only, not advice.`,
      url: '/dashboard',
      tag: `zone-${e.ticker}`,
    })
    sent += delivered
    if (delivered > 0) notified.push(e.ticker)
  }

  return NextResponse.json({ sent, entered: entered.length, notified, tracked: rows.length })
}
