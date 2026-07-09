import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { fetchAllMarketData } from '@/lib/market-data'
import { generateAndCacheAllSignals, getTraderProfile } from '@/lib/signal-engine'

export async function GET(req: NextRequest) {
  // 1. Auth check
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Subscription check (trialing counts as access)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', session.user.id)
    .single()

  const hasAccess = (sub?.status === 'active' || sub?.status === 'trialing') &&
    sub?.current_period_end &&
    new Date(sub.current_period_end) > new Date()

  if (!hasAccess) {
    return NextResponse.json({ error: 'Subscription required', code: 'NO_SUBSCRIPTION' }, { status: 403 })
  }

  // 3. Serve cached signals if fresh
  const adminSupabase = createAdminClient()
  const { data: cachedSignals } = await adminSupabase
    .from('signals')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('confidence', { ascending: false })

  if (cachedSignals && cachedSignals.length > 0) {
    return NextResponse.json({ signals: cachedSignals, cached: true })
  }

  // 4. Generate fresh, personalized to the requesting user's profile
  try {
    const traderProfile = await getTraderProfile(session.user.id)
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
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const snapshots = await fetchAllMarketData()
  const signals = await generateAndCacheAllSignals(snapshots, null)
  return NextResponse.json({ count: signals.length })
}
