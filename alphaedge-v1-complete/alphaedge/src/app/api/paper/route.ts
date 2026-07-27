import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseContext } from '@/lib/supabase/context'
import { getUserSubscription } from '@/lib/subscription'
import { TRACKED_ASSETS } from '@/lib/market-data'
import { buildPortfolio, heldQuantity, PaperTrade } from '@/lib/paper'

// ── Paper trading ─────────────────────────────────────────
// Practice portfolio: real prices, imaginary money. Trials included —
// giving a trial user something to actually do is most of the point.

const TRACKED = new Set(TRACKED_ASSETS.crypto)

async function loadState(ctx: any) {
  const [{ data: trades }, { data: signals }] = await Promise.all([
    ctx.supabase
      .from('paper_trades')
      .select('id, ticker, side, quantity, price, signal_at_trade, created_at')
      .order('created_at', { ascending: false }),
    ctx.supabaseAdmin
      .from('signals')
      .select('ticker, price, signal_type')
      .gt('expires_at', new Date().toISOString()),
  ])

  const rows: PaperTrade[] = (trades ?? []).map((t: any) => ({
    ...t, quantity: Number(t.quantity), price: Number(t.price),
  }))
  const priceNow = new Map<string, number>(
    (signals ?? []).map((s: any) => [s.ticker as string, Number(s.price)]),
  )
  const stanceNow = new Map<string, string>(
    (signals ?? []).map((s: any) => [s.ticker as string, s.signal_type as string]),
  )
  return { rows, priceNow, stanceNow }
}

export async function GET() {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { live } = await getUserSubscription(ctx.supabase, ctx.userClaims!.id)
  if (!live) {
    return NextResponse.json({ error: 'Subscription required', code: 'NO_SUBSCRIPTION' }, { status: 403 })
  }

  const { rows, priceNow } = await loadState(ctx)
  return NextResponse.json({ portfolio: buildPortfolio(rows, priceNow), trades: rows.slice(0, 50) })
}

export async function POST(req: NextRequest) {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { live } = await getUserSubscription(ctx.supabase, ctx.userClaims!.id)
  if (!live) {
    return NextResponse.json({ error: 'Subscription required', code: 'NO_SUBSCRIPTION' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const ticker = String(body.ticker ?? '').toUpperCase().trim()
  const side = body.side === 'sell' ? 'sell' : 'buy'
  const quantity = Number(body.quantity)

  if (!TRACKED.has(ticker)) {
    return NextResponse.json({ error: 'Unknown or untracked asset' }, { status: 400 })
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ error: 'Enter an amount greater than zero' }, { status: 400 })
  }

  const { rows, priceNow, stanceNow } = await loadState(ctx)

  // Fill at the live analysis price. Taking a price from the request body
  // would let anyone buy at a dollar and sell at a million.
  const price = priceNow.get(ticker)
  if (price == null || !(price > 0)) {
    return NextResponse.json(
      { error: `No live price for ${ticker} right now — try again after the next refresh` },
      { status: 409 },
    )
  }

  const portfolio = buildPortfolio(rows, priceNow)

  if (side === 'buy') {
    const cost = quantity * price
    if (cost > portfolio.cash + 1e-9) {
      return NextResponse.json(
        { error: `That costs $${cost.toFixed(2)} and you have $${portfolio.cash.toFixed(2)} in cash` },
        { status: 400 },
      )
    }
  } else {
    const held = heldQuantity(rows, ticker)
    if (quantity > held + 1e-9) {
      return NextResponse.json(
        { error: held > 0 ? `You only hold ${held} ${ticker}` : `You don't hold any ${ticker}` },
        { status: 400 },
      )
    }
  }

  const { error } = await ctx.supabase.from('paper_trades').insert({
    ticker, side, quantity, price, signal_at_trade: stanceNow.get(ticker) ?? null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { rows: after } = await loadState(ctx)
  return NextResponse.json({ portfolio: buildPortfolio(after, priceNow), trades: after.slice(0, 50) })
}

// Reset back to a clean $10,000 — the ledger is the account, so clearing
// it is the reset.
export async function DELETE() {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await ctx.supabase
    .from('paper_trades')
    .delete()
    .eq('user_id', ctx.userClaims!.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ portfolio: buildPortfolio([], new Map()), trades: [] })
}
