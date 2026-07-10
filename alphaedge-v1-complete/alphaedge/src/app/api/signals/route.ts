import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseContext } from '@/lib/supabase/context'
import { fetchAllMarketData } from '@/lib/market-data'
import { generateAndCacheAllSignals, getTraderProfile } from '@/lib/signal-engine'

// Vercel cron sends `Authorization: Bearer ${CRON_SECRET}` when the
// CRON_SECRET env var is set on the project.
function isCronRequest(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  return !!secret && req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  // Hourly cron refresh (vercel.json) — no user session involved
  if (isCronRequest(req)) {
    const snapshots = await fetchAllMarketData()
    const signals = await generateAndCacheAllSignals(snapshots, null)
    return NextResponse.json({ count: signals.length, refreshed: true })
  }

  // 1. Auth check — verifies the session JWT
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Subscription check (trialing counts as access)
  const { data: sub } = await ctx.supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', ctx.userClaims!.id)
    .single()

  const hasAccess = (sub?.status === 'active' || sub?.status === 'trialing') &&
    sub?.current_period_end &&
    new Date(sub.current_period_end) > new Date()

  if (!hasAccess) {
    return NextResponse.json({ error: 'Subscription required', code: 'NO_SUBSCRIPTION' }, { status: 403 })
  }

  // 3. Serve cached signals if fresh
  const supabaseAdmin = ctx.supabaseAdmin
  const { data: cachedSignals } = await supabaseAdmin
    .from('signals')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('confidence', { ascending: false })

  if (cachedSignals && cachedSignals.length > 0) {
    return NextResponse.json({ signals: cachedSignals, cached: true })
  }

  // 4. Generate fresh, personalized to the requesting user's profile
  try {
    const traderProfile = await getTraderProfile(ctx.userClaims!.id)
    const snapshots = await fetchAllMarketData()
    const signals = await generateAndCacheAllSignals(snapshots, traderProfile)
    return NextResponse.json({ signals, cached: false })
  } catch (err: any) {
    console.error('Signal generation error:', err)
    return NextResponse.json({ error: 'Failed to generate signals' }, { status: 500 })
  }
}

// Force refresh (cron / admin only)
export async function POST(req: NextRequest) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const snapshots = await fetchAllMarketData()
  const signals = await generateAndCacheAllSignals(snapshots, null)
  return NextResponse.json({ count: signals.length })
}
