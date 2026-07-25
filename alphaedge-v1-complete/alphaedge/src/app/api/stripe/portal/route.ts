import { NextResponse } from 'next/server'
import { createSupabaseContext } from '@/lib/supabase/context'
import { createPortalSession } from '@/lib/stripe'
import { getUserSubscription } from '@/lib/subscription'

// Opens a Stripe billing-portal session for the signed-in user, where they
// can update their card, view invoices, or cancel their subscription.
export async function POST() {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Prefer the live subscription's customer; fall back to the most recent
  // one so someone whose payment failed can still open the portal and fix
  // their card — that is precisely when they need it most.
  const { live, latest } = await getUserSubscription(ctx.supabaseAdmin, ctx.userClaims!.id)
  const customerId = live?.stripe_customer_id ?? latest?.stripe_customer_id

  if (!customerId) {
    return NextResponse.json({ error: 'No subscription found for this account' }, { status: 404 })
  }

  try {
    const session = await createPortalSession({
      customerId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Portal session error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
