import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseContext } from '@/lib/supabase/context'
import { getUserSubscription } from '@/lib/subscription'
import { coinKey, TRACKED_COIN_KEYS } from '@/lib/assets'

// ── Coin requests ─────────────────────────────────────────
// Paying subscribers nominate up to 3 coins they'd like added. Trialing
// users are deliberately excluded — this is a perk of paying. The rules
// are mirrored in RLS and a trigger (see the coin_requests migration), so
// the checks here are for good error messages rather than for safety.

const MAX_REQUESTS = 3

async function isPaidSubscriber(ctx: { supabase: any; userId: string }) {
  const { rows } = await getUserSubscription(ctx.supabase, ctx.userId)
  return rows.some(r =>
    r.status === 'active' &&
    !!r.current_period_end &&
    new Date(r.current_period_end).getTime() > Date.now()
  )
}

export async function GET() {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = ctx.userClaims!.id

  const [{ data, error }, eligible] = await Promise.all([
    ctx.supabase
      .from('coin_requests')
      .select('id, coin, created_at')
      .order('created_at', { ascending: true }),
    isPaidSubscriber({ supabase: ctx.supabase, userId }),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data ?? [], eligible, limit: MAX_REQUESTS })
}

export async function POST(req: NextRequest) {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = ctx.userClaims!.id

  if (!(await isPaidSubscriber({ supabase: ctx.supabase, userId }))) {
    return NextResponse.json(
      { error: 'Coin requests are available on a paid plan', code: 'NOT_PAID' },
      { status: 403 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const coin = String(body.coin ?? '').trim().slice(0, 40)
  const key = coinKey(coin)

  if (!key) {
    return NextResponse.json({ error: 'Enter a coin name or ticker' }, { status: 400 })
  }
  if (TRACKED_COIN_KEYS.has(key)) {
    return NextResponse.json({ error: `${coin} is already on AlphaEdge` }, { status: 400 })
  }

  const { count } = await ctx.supabase
    .from('coin_requests')
    .select('*', { count: 'exact', head: true })
  if ((count ?? 0) >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: `You've used all ${MAX_REQUESTS} requests — remove one to add another` },
      { status: 400 },
    )
  }

  const { data, error } = await ctx.supabase
    .from('coin_requests')
    .insert({ coin, coin_key: key })
    .select('id, coin, created_at')
    .single()

  if (error) {
    // 23505 = the (user_id, coin_key) unique index
    if (error.code === '23505') {
      return NextResponse.json({ error: `You've already requested ${coin}` }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ request: data })
}

export async function DELETE(req: NextRequest) {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing request id' }, { status: 400 })

  const { error } = await ctx.supabase.from('coin_requests').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
