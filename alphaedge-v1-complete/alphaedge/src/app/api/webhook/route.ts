import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  async function upsertSubscription(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId
    const plan = subscription.metadata.plan as 'weekly' | 'monthly'
    if (!userId) { console.error('No userId in subscription metadata'); return }

    const statusMap: Record<string, string> = {
      active: 'active', canceled: 'canceled', past_due: 'past_due',
      trialing: 'trialing', incomplete: 'incomplete',
      incomplete_expired: 'canceled', unpaid: 'past_due',
    }

    // On newer Stripe API versions (2025+), current_period_start/end moved
    // from the subscription to its items — read whichever is present.
    const sub = subscription as any
    const item = sub.items?.data?.[0]
    const periodStart = sub.current_period_start ?? item?.current_period_start ?? null
    const periodEnd = sub.current_period_end ?? item?.current_period_end ?? null

    const { error } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan,
      status: statusMap[subscription.status] ?? 'incomplete',
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_subscription_id' })

    if (error) console.error('Subscription upsert error:', error)
  }

  try {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await upsertSubscription(event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as any
      // invoice.subscription moved to invoice.parent.subscription_details on
      // newer Stripe API versions — check both locations.
      const subscriptionId =
        invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? null
      if (subscriptionId) {
        await supabase.from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id)
      }
      break
    }

    default:
      break
  }
  } catch (err: any) {
    // Surface handler errors in Stripe's delivery log (500 → Stripe retries)
    console.error('Webhook handler error:', err)
    return NextResponse.json(
      { error: 'Handler failed', detail: String(err?.message ?? err).slice(0, 300) },
      { status: 500 },
    )
  }

  return NextResponse.json({ received: true })
}
