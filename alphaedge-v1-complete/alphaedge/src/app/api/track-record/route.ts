import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Public endpoint powering the /track-record marketing page: recent signal
// changes with the price at the time of the call and the latest known price.
// Read-only, no user data involved.

export const revalidate = 0

export async function GET() {
  const supabase = createAdminClient()

  const { data: history, error } = await supabase
    .from('signal_history')
    .select('ticker, market, signal_type, previous_type, confidence, price, generated_at')
    .order('generated_at', { ascending: false })
    .limit(60)

  if (error) return NextResponse.json({ error: 'Could not load track record' }, { status: 500 })

  // Latest price per ticker from the live signals cache
  const { data: current } = await supabase
    .from('signals')
    .select('ticker, price')
  const priceNow = new Map((current ?? []).map(r => [r.ticker as string, Number(r.price)]))

  const rows = (history ?? []).map(h => ({
    ...h,
    price: Number(h.price),
    current_price: priceNow.get(h.ticker) ?? null,
  }))

  return NextResponse.json({ history: rows })
}
