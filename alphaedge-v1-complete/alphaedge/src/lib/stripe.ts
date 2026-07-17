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
  userId, email, plan, successUrl, cancelUrl,
}: {
  userId: string
  email: string
  plan: 'weekly' | 'monthly'
  successUrl?: string
  cancelUrl?: string
}) {
  const selectedPlan = PLANS[plan]

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    // No payment_method_types: Checkout automatically offers every method
    // enabled in the Stripe dashboard, localized to the customer's country.
    customer_email: email,
    line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
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
