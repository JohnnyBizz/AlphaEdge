import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseContext } from '@/lib/supabase/context'
import { pushConfigured } from '@/lib/push'

// ── Push subscription management ──────────────────────────
// The browser creates the subscription; this stores it against the user so
// the alert job knows where to send. All writes go through the caller's own
// RLS-scoped client, so a user can only ever register or remove their own.

export async function GET() {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { count } = await ctx.supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    enabled: (count ?? 0) > 0,
    devices: count ?? 0,
    available: pushConfigured(),
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
  })
}

export async function POST(req: NextRequest) {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!pushConfigured()) {
    return NextResponse.json({ error: 'Push is not configured on this deployment' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const endpoint = String(body.endpoint ?? '')
  const p256dh = String(body.keys?.p256dh ?? '')
  const auth = String(body.keys?.auth ?? '')

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Incomplete push subscription' }, { status: 400 })
  }

  // Re-subscribing on the same device returns the same endpoint, so upsert
  // rather than insert — otherwise a reinstall would duplicate notifications.
  const { error } = await ctx.supabase
    .from('push_subscriptions')
    .upsert({ endpoint, p256dh, auth }, { onConflict: 'endpoint' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ enabled: true })
}

export async function DELETE(req: NextRequest) {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const endpoint = req.nextUrl.searchParams.get('endpoint')
  const query = ctx.supabase.from('push_subscriptions').delete()
  // No endpoint given means "turn it off everywhere for me".
  const { error } = endpoint ? await query.eq('endpoint', endpoint) : await query.neq('endpoint', '')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ enabled: false })
}
