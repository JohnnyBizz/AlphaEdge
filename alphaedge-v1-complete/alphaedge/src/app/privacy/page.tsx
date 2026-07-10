import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — AlphaEdge' }

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0d12', color: '#c0c8d8', padding: '48px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.8, fontSize: 14 }}>
        <Link href="/" style={{ color: '#00e5a0', fontSize: 13, textDecoration: 'none' }}>← Back to AlphaEdge</Link>

        <h1 style={{ color: '#e8eaf0', fontSize: 26, marginTop: 24, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: '#4a5568', fontSize: 12, marginBottom: 32 }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>1. Information We Collect</h2>
        <p><strong style={{ color: '#c0c8d8' }}>Account information:</strong> When you register, we collect your name, email address, and password (stored in hashed form by our authentication provider, Supabase).</p>
        <p><strong style={{ color: '#c0c8d8' }}>Payment information:</strong> Payments are processed by Stripe. We do not store your card number. We receive limited billing metadata from Stripe (such as subscription status and the last four digits of your card).</p>
        <p><strong style={{ color: '#c0c8d8' }}>Profile preferences:</strong> If you complete the onboarding questionnaire, we store your selected trading style, profit target, and risk tolerance to personalize your dashboard.</p>
        <p><strong style={{ color: '#c0c8d8' }}>Usage data:</strong> We may collect standard technical data such as IP address, browser type, and pages visited to operate and secure the Service.</p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>2. How We Use Your Information</h2>
        <p>
          We use your information to: provide and personalize the Service; process subscription payments;
          communicate with you about your account; maintain security and prevent fraud; and comply with
          legal obligations. We do not sell your personal information.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>3. Third-Party Services</h2>
        <p>We share data with the following service providers solely to operate the platform:</p>
        <p>
          <strong style={{ color: '#c0c8d8' }}>Supabase</strong> (authentication and database hosting) ·{' '}
          <strong style={{ color: '#c0c8d8' }}>Stripe</strong> (payment processing) ·{' '}
          <strong style={{ color: '#c0c8d8' }}>Vercel</strong> (application hosting) ·{' '}
          <strong style={{ color: '#c0c8d8' }}>Anthropic</strong> (AI analysis generation — market data
          only; your personal information is not sent to the AI) ·{' '}
          <strong style={{ color: '#c0c8d8' }}>Polygon.io and CoinGecko</strong> (market data providers —
          they do not receive your personal information).
        </p>
        <p>Each provider processes data under its own privacy policy and our agreements with them.</p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>4. Data Retention</h2>
        <p>
          We retain your account data for as long as your account is active. If you delete your account,
          we delete or anonymize your personal data within a reasonable period, except where retention is
          required for legal, tax, or fraud-prevention purposes.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>5. Your Rights</h2>
        <p>
          Depending on your jurisdiction, you may have the right to access, correct, export, or delete
          your personal data, and to object to or restrict certain processing. To exercise these rights,
          contact us through your account dashboard. California residents may have additional rights
          under the CCPA/CPRA; EU/UK residents may have rights under the GDPR.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>6. Security</h2>
        <p>
          We use industry-standard measures to protect your data, including encrypted connections (TLS),
          hashed passwords, and row-level security on our database. No method of transmission or storage
          is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>7. Cookies</h2>
        <p>
          We use essential cookies for authentication and session management. We do not use third-party
          advertising cookies.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>8. Children</h2>
        <p>
          The Service is not directed to individuals under 18, and we do not knowingly collect data from
          them.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be communicated via
          email or in-app notice.
        </p>

        <p style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', color: '#4a5568', fontSize: 13 }}>
          See also our <Link href="/terms" style={{ color: '#00e5a0' }}>Terms of Service</Link> and{' '}
          <Link href="/disclaimer" style={{ color: '#00e5a0' }}>Disclaimer</Link>.
        </p>
      </div>
    </div>
  )
}
