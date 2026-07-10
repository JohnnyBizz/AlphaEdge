import { NextResponse } from 'next/server'
import { createSupabaseContext } from '@/lib/supabase/context'
import { createPortalSession } from '@/lib/stripe'

// Opens a Stripe billing-portal session for the signed-in user, where they
// can update their card, view invoices, or cancel their subscription.
export async function POST() {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await ctx.supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', ctx.userClaims!.id)
    .single()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found for this account' }, { status: 404 })
  }

  try {
    const session = await createPortalSession({
      customerId: sub.stripe_customer_id,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Portal session error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
