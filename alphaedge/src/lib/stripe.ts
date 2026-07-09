import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const PLANS = {
  weekly:  { name: 'Weekly',  priceId: process.env.STRIPE_WEEKLY_PRICE_ID!,  amount: 900,  interval: 'week' as const },
  monthly: { name: 'Monthly', priceId: process.env.STRIPE_MONTHLY_PRICE_ID!, amount: 2900, interval: 'month' as const },
}

export async function createCheckoutSession({
  userId, email, plan,
}: {
  userId: string
  email: string
  plan: 'weekly' | 'monthly'
}) {
  const selectedPlan = PLANS[plan]

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId, plan },
    },
    metadata: { userId, plan },
    // New subscribers land on the trader-profile onboarding wizard
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth?canceled=true`,
  })

  return session
}

export async function createPortalSession({
  customerId, returnUrl,
}: { customerId: string; returnUrl: string }) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
