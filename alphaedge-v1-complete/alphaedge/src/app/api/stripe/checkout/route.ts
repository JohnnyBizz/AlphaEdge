import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, createPortalSession, findLiveStripeSubscription } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSubscription } from '@/lib/subscription'

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, email } = await req.json()

    if (!plan || !userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { live, latest } = await getUserSubscription(createAdminClient(), userId)

    // Already subscribed: open the billing portal instead of starting a
    // second subscription the customer would then be charged for twice.
    if (live?.stripe_customer_id) {
      const portal = await createPortalSession({
        customerId: live.stripe_customer_id,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      })
      return NextResponse.json({ url: portal.url })
    }

    // Second line of defence: ask Stripe directly. Our row can be stale —
    // a renewal whose webhook hasn't landed leaves it looking expired — and
    // trusting it alone once let the same account buy three subscriptions in
    // 66 seconds. Stripe is the authority on what someone is already paying
    // for, so check there before taking money again.
    if (latest?.stripe_customer_id) {
      const existing = await findLiveStripeSubscription(latest.stripe_customer_id)
      if (existing) {
        const portal = await createPortalSession({
          customerId: latest.stripe_customer_id,
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        })
        return NextResponse.json({ url: portal.url })
      }
    }

    const session = await createCheckoutSession({
      userId,
      email,
      plan,
      // Keep one Stripe customer per account across re-subscribes.
      customerId: latest?.stripe_customer_id ?? null,
      // One free trial per account — a returning subscriber pays right away.
      withTrial: latest === null,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
