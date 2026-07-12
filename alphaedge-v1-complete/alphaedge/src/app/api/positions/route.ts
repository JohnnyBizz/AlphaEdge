import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseContext } from '@/lib/supabase/context'
import { TRACKED_ASSETS } from '@/lib/market-data'

// All queries use ctx.supabase (the caller's RLS-scoped client), so users
// can only ever read or modify their own rows.

export async function GET() {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await ctx.supabase
    .from('positions')
    .select('id, ticker, market, quantity, entry_price, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ positions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker, market, quantity, entry_price } = await req.json()

  const validTickers = market === 'stock' ? TRACKED_ASSETS.stocks : TRACKED_ASSETS.crypto
  if (!ticker || !validTickers.includes(ticker)) {
    return NextResponse.json({ error: 'Unknown or untracked asset' }, { status: 400 })
  }
  const qty = Number(quantity)
  const entry = Number(entry_price)
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(entry) || entry <= 0) {
    return NextResponse.json({ error: 'Quantity and entry price must be positive numbers' }, { status: 400 })
  }

  const { data, error } = await ctx.supabase
    .from('positions')
    .insert({ ticker, market, quantity: qty, entry_price: entry })
    .select('id, ticker, market, quantity, entry_price, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ position: data })
}

export async function DELETE(req: NextRequest) {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing position id' }, { status: 400 })

  const { error } = await ctx.supabase.from('positions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
