# AlphaEdge — Complete Build (v1.0)

AI-powered educational market analysis SaaS. This is the COMPLETE project —
core app + trader profile onboarding + legal pages + all compliance fixes
merged into one build. This replaces all previous zips.

---

## What's included

- Email/password auth (Supabase) with signup → payment → onboarding flow
- Stripe subscriptions: $9/week and $29/month with 7-day free trial
- 3-step trader profile onboarding (trade style, profit target, risk tolerance)
- AI analysis engine (Anthropic API) personalized to each user's profile
- Market data: Polygon.io (stocks) + CoinGecko (crypto) with server-side
  RSI, MACD, Bollinger Bands computation
- Dashboard with filtering, confidence scores, expandable AI reasoning
- Legal pages: /terms, /privacy, /disclaimer (Stripe review-ready)
- Compliant marketing copy (educational framing, no performance claims)

---

## Setup — do these in order

### 1. Install prerequisites (one time)
- Node.js LTS from nodejs.org
- VS Code from code.visualstudio.com

### 2. Install project dependencies
Open this folder in VS Code → Terminal → run:
```bash
npm install
```

### 3. Create your environment file
```bash
cp .env.local.example .env.local     # Mac/Linux
copy .env.local.example .env.local   # Windows
```
(or just duplicate the file in VS Code and rename it)

### 4. Supabase (free)
1. Create a project at supabase.com
2. SQL Editor → paste the ENTIRE contents of `supabase-schema.sql` → Run
3. Settings → API → copy into .env.local:
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_ROLE_KEY (keep secret!)

### 5. Stripe (free account)
1. Create account at stripe.com — STAY IN TEST MODE for now
2. Products → Add product:
   - "AlphaEdge Weekly" — $9.00 USD, recurring weekly → copy Price ID
   - "AlphaEdge Monthly" — $29.00 USD, recurring monthly → copy Price ID
3. Developers → API keys → copy sk_test_ and pk_test_ keys
4. Put all four values in .env.local
5. Webhook setup comes AFTER deployment (step 10)

### 6. Anthropic
1. console.anthropic.com → API Keys → Create Key
2. Add billing ($5 credit is plenty for testing)
3. Paste key into ANTHROPIC_API_KEY

### 7. Market data (both free tiers)
- polygon.io → sign up → copy API key → POLYGON_API_KEY
- coingecko.com/api → sign up → copy demo key → COINGECKO_API_KEY

### 8. Run locally
```bash
npm run dev
```
Open http://localhost:3000 — you should see the login page.
Test signup with Stripe test card: 4242 4242 4242 4242, any future
expiry, any CVC. Flow: signup → Stripe checkout → onboarding wizard →
dashboard.

For webhooks to work locally, in a second terminal:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```
(requires the Stripe CLI: stripe.com/docs/stripe-cli)
Copy the whsec_ it prints into STRIPE_WEBHOOK_SECRET and restart npm run dev.

### 9. Deploy to Vercel
1. Push this folder to a GitHub repo
2. vercel.com → Import the repo
3. Settings → Environment Variables → add EVERY variable from .env.local,
   BUT change NEXT_PUBLIC_APP_URL to your Vercel URL
   (e.g. https://alphaedge.vercel.app)
4. Deploy

### 10. Point Stripe at production
1. Stripe → Developers → Webhooks → Add endpoint:
   URL: https://YOUR-VERCEL-URL/api/webhook
   Events: customer.subscription.created, customer.subscription.updated,
           customer.subscription.deleted, invoice.payment_failed
2. Copy the signing secret → update STRIPE_WEBHOOK_SECRET in Vercel → Redeploy

### 11. Hourly signal refresh (recommended)
Create `vercel.json` in the project root:
```json
{
  "crons": [{ "path": "/api/signals", "schedule": "0 * * * *" }]
}
```
Note: Vercel cron sends GET requests; the POST refresh endpoint requires the
service-role bearer token. Simplest approach: signals also auto-regenerate
whenever a user loads the dashboard and the cache has expired, so cron is
optional at low scale.

### 12. Going live checklist
- [ ] Fill in your state in Section 11 of src/app/terms/page.tsx
- [ ] Talk to a fintech attorney about your marketing (~1 hour, worth it)
- [ ] Stripe: complete business profile using the description below
- [ ] Switch Stripe from test keys to live keys in Vercel + create live-mode
      products and webhook (test and live mode are fully separate in Stripe)
- [ ] Do one full live-mode test purchase yourself, then refund it

---

## Stripe business profile

**Category:** Software as a Service (SaaS) / Information Services

**Description:**
> AlphaEdge is a subscription-based software platform that provides
> educational market analysis and technical indicator data for stocks and
> cryptocurrencies. Subscribers pay a weekly or monthly fee to access a
> dashboard displaying AI-generated technical analysis, including indicators
> like RSI, MACD, and volume trends. All content is for informational and
> educational purposes only — we do not execute trades, hold customer funds,
> manage assets, or provide personalized financial advice.

**Website:** your Vercel URL (not the Supabase URL)

---

## Content rules (do not break these)

1. Never publish accuracy percentages, win rates, or "backtested" claims
   unless you have documentation to prove them.
2. No "guaranteed", "exactly", "always" language anywhere.
3. Educational framing everywhere: "analysis suggests", never "you should buy".
4. Keep disclaimers visible on landing page and dashboard (already built in).

---

## Monthly running costs

| Service | Cost |
|---|---|
| Vercel | Free → $20/mo Pro |
| Supabase | Free → $25/mo Pro |
| Polygon.io | Free (delayed) → $29/mo Starter (real-time) |
| CoinGecko | Free tier |
| Anthropic API | ~$5 testing → $80–150/mo at ~100 users |

Break-even at roughly 5–15 weekly subscribers depending on tier choices.

---

## Project structure

```
alphaedge/
├── package.json / configs
├── supabase-schema.sql          ← run once in Supabase SQL Editor
├── .env.local.example           ← copy to .env.local, fill in keys
└── src/
    ├── lib/
    │   ├── supabase.ts          ← DB clients (browser/server/admin)
    │   ├── stripe.ts            ← checkout + billing portal
    │   ├── market-data.ts       ← Polygon + CoinGecko + indicators
    │   └── signal-engine.ts     ← Claude analysis, profile-aware
    └── app/
        ├── page.tsx             ← routes to /auth or /dashboard
        ├── auth/                ← login/signup (compliant copy)
        ├── onboarding/          ← 3-step trader profile wizard
        ├── dashboard/           ← main analysis dashboard
        ├── terms|privacy|disclaimer/  ← legal pages
        └── api/
            ├── signals/         ← protected analysis endpoint
            ├── profile/         ← save/load trader profile
            ├── stripe/checkout/ ← create checkout session
            └── webhook/         ← Stripe → Supabase sync
```
