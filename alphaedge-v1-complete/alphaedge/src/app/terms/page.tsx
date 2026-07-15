import Link from 'next/link'

export const metadata = { title: 'Terms of Service — AlphaEdge' }

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0d12', color: '#c0c8d8', padding: '48px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.8, fontSize: 14 }}>
        <Link href="/" style={{ color: '#00e5a0', fontSize: 13, textDecoration: 'none' }}>← Back to AlphaEdge</Link>

        <h1 style={{ color: '#e8eaf0', fontSize: 26, marginTop: 24, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: '#4a5568', fontSize: 12, marginBottom: 32 }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>1. Acceptance of Terms</h2>
        <p>
          By creating an account or using AlphaEdge (&quot;the Service&quot;), you agree to be bound by these
          Terms of Service. If you do not agree, do not use the Service. You must be at least 18 years
          old to use the Service.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>2. Description of Service</h2>
        <p>
          AlphaEdge is a subscription-based software platform that provides educational market analysis
          and technical indicator data for cryptocurrencies. The Service displays AI-generated
          technical analysis for informational and educational purposes only. We do not execute trades,
          hold customer funds, manage assets, or provide personalized financial advice. See our{' '}
          <Link href="/disclaimer" style={{ color: '#00e5a0' }}>Disclaimer</Link> for important
          information about the nature of our content.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>3. Subscriptions, Billing, and Refunds</h2>
        <p>
          Access to the Service requires a paid subscription, billed in advance on a weekly or monthly
          basis (per the plan you choose) through our payment processor, Stripe. Subscriptions renew
          automatically at the end of each billing period until canceled.
        </p>
        <p>
          <strong style={{ color: '#c0c8d8' }}>Free trial.</strong> New subscriptions include a 7-day
          free trial. You will not be charged during the trial, and you may cancel at any time before it
          ends to avoid being charged. If you do not cancel before the trial ends, your paid subscription
          begins automatically and your payment method is charged for the first billing period.
        </p>
        <p>
          <strong style={{ color: '#c0c8d8' }}>Cancellation.</strong> You may cancel at any time from the
          billing portal in your dashboard or through Stripe. Cancellation stops all future charges and
          takes effect at the end of your current billing period; you retain access until then.
        </p>
        <p>
          <strong style={{ color: '#c0c8d8' }}>Refunds.</strong> Except where a refund is required by
          applicable law (including certain consumer-protection rights in the EU, UK, and elsewhere),
          subscription fees are non-refundable, including for partial billing periods after a payment has
          been taken. If you believe you were charged in error, contact us at{' '}
          <a href="mailto:support@alphaedge.network" style={{ color: '#00e5a0' }}>support@alphaedge.network</a>{' '}
          and we will review your request in good faith.
        </p>
        <p>
          We may change subscription pricing with reasonable advance notice; price changes apply only to
          subsequent billing periods.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>4. Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all
          activity under your account. You agree to provide accurate information when registering and to
          notify us promptly of any unauthorized use. Accounts are for individual use; sharing account
          access is prohibited.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <p>
          (a) resell, redistribute, or republish content from the Service without written permission;
          (b) scrape, crawl, or use automated means to extract data from the Service;
          (c) reverse engineer or attempt to access non-public parts of the Service;
          (d) use the Service for any unlawful purpose; or
          (e) misrepresent the Service&apos;s content as personalized financial advice to others.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>6. Intellectual Property</h2>
        <p>
          The Service, including its software, design, and content, is owned by us or our licensors and
          is protected by intellectual property laws. Your subscription grants you a limited,
          non-exclusive, non-transferable license to access the Service for personal use.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>7. No Warranty</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS
          OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY,
          OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR
          THAT ANY ANALYSIS OR DATA WILL BE ACCURATE OR RELIABLE.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>8. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY TRADING OR INVESTMENT LOSSES, LOSS OF
          PROFITS, OR LOSS OF DATA, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY
          CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE THREE (3) MONTHS PRECEDING THE CLAIM.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>9. Termination</h2>
        <p>
          We may suspend or terminate your access for violation of these Terms. You may terminate at any
          time by canceling your subscription. Sections 6–8 survive termination.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>10. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Material changes will be communicated via email or
          in-app notice. Continued use of the Service after changes take effect constitutes acceptance.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>11. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the state in which the Service operator is established,
          without regard to conflict-of-law principles. [Update this section with your state and any
          dispute-resolution terms after consulting your attorney.]
        </p>

        <p style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', color: '#4a5568', fontSize: 13 }}>
          See also our <Link href="/privacy" style={{ color: '#00e5a0' }}>Privacy Policy</Link> and{' '}
          <Link href="/disclaimer" style={{ color: '#00e5a0' }}>Disclaimer</Link>.
        </p>
      </div>
    </div>
  )
}
