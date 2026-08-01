import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const PLANS = {
  weekly:  { name: 'Weekly',  priceId: process.env.STRIPE_WEEKLY_PRICE_ID!,  amount: 900,  interval: 'week'  as const },
  monthly: { name: 'Monthly', priceId: process.env.STRIPE_MONTHLY_PRICE_ID!, amount: 2900, interval: 'month' as const },
}

// Creates a Stripe Checkout session. After successful payment the
// customer is sent to /onboarding to complete their trader profile.
export async function createCheckoutSession({
  userId, email, plan, customerId, withTrial = true, successUrl, cancelUrl,
}: {
  userId: string
  email: string
  plan: 'weekly' | 'monthly'
  /** Reuse this Stripe customer instead of creating another one. */
  customerId?: string | null
  /** The 7-day free trial is once per account — off for returning users. */
  withTrial?: boolean
  successUrl?: string
  cancelUrl?: string
}) {
  const selectedPlan = PLANS[plan]

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    // No payment_method_types: Checkout automatically offers every method
    // enabled in the Stripe dashboard, localized to the customer's country.
    // Passing an existing `customer` keeps one Stripe customer per account —
    // `customer_email` alone makes Stripe mint a new customer per checkout,
    // which scatters a user's billing history across duplicate records.
    ...(customerId
      ? { customer: customerId, customer_update: { address: 'auto' as const, name: 'auto' as const } }
      : { customer_email: email }),
    line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
    subscription_data: {
      ...(withTrial ? { trial_period_days: 7 } : {}),
      metadata: { userId, plan },
    },
    metadata: { userId, plan },
    // Stripe Tax (VAT/GST for international customers). Off until Tax is
    // enabled in the Stripe dashboard — enabling it here first would make
    // checkout-session creation fail.
    ...(process.env.STRIPE_TAX_ENABLED === 'true' ? { automatic_tax: { enabled: true } } : {}),
    success_url: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
    cancel_url:  cancelUrl  ?? `${process.env.NEXT_PUBLIC_APP_URL}/auth?canceled=true`,
  })
}

export async function createPortalSession({ customerId, returnUrl }: { customerId: string; returnUrl: string }) {
  return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl })
}

/**
 * Whether this customer already has a subscription Stripe considers live.
 *
 * Used as the last check before creating a new one. Our own row can lag a
 * renewal by minutes, and during that gap a customer looks unsubscribed to
 * us while Stripe is happily billing them — which is how one account ended
 * up buying three subscriptions inside 66 seconds. Failing open (returning
 * false when Stripe can't be reached) keeps genuine signups working; the
 * database check above is still in front of it.
 */
export async function findLiveStripeSubscription(customerId: string) {
  try {
    const { data } = await stripe.subscriptions.list({
      customer: customerId, status: 'all', limit: 20,
    })
    return data.find(s => s.status === 'active' || s.status === 'trialing') ?? null
  } catch (err) {
    console.error('Stripe subscription lookup failed:', err)
    return null
  }
}
