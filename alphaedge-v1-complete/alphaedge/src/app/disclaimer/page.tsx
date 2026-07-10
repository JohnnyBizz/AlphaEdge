import Link from 'next/link'

export const metadata = { title: 'Disclaimer — AlphaEdge' }

export default function DisclaimerPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0d12', color: '#c0c8d8', padding: '48px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.8, fontSize: 14 }}>
        <Link href="/" style={{ color: '#00e5a0', fontSize: 13, textDecoration: 'none' }}>← Back to AlphaEdge</Link>

        <h1 style={{ color: '#e8eaf0', fontSize: 26, marginTop: 24, marginBottom: 8 }}>Disclaimer</h1>
        <p style={{ color: '#4a5568', fontSize: 12, marginBottom: 32 }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>Not Financial Advice</h2>
        <p>
          AlphaEdge is an educational and informational software platform. Nothing on this website or in
          our service constitutes financial, investment, legal, or tax advice. The analysis, indicators,
          and AI-generated commentary we provide are for informational and educational purposes only.
        </p>
        <p>
          We are not a registered investment adviser, broker-dealer, or financial planner. We do not
          provide personalized investment recommendations, and no content on this platform should be
          interpreted as a recommendation to buy, sell, or hold any security, cryptocurrency, or other
          financial instrument.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>Trading Involves Substantial Risk</h2>
        <p>
          Trading and investing in stocks, cryptocurrencies, and other financial instruments involves
          substantial risk of loss, including the potential loss of your entire investment. Cryptocurrency
          markets are especially volatile and unregulated in many jurisdictions. You should never trade
          with money you cannot afford to lose.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>No Performance Guarantees</h2>
        <p>
          Past performance of any indicator, signal, or analysis is not indicative of future results.
          AI-generated analysis is based on historical and current market data and can be wrong. Markets
          are influenced by countless factors that no model can fully predict. We make no representations
          or warranties about the accuracy, completeness, or reliability of any information provided.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>Your Responsibility</h2>
        <p>
          Any decision to trade or invest is yours alone. Before making any financial decision, you should
          conduct your own research and consult with a qualified, licensed financial adviser who can
          evaluate your individual circumstances. By using AlphaEdge, you acknowledge that you bear full
          responsibility for your trading and investment decisions and their outcomes.
        </p>

        <h2 style={{ color: '#e8eaf0', fontSize: 17, marginTop: 32 }}>Data Accuracy</h2>
        <p>
          Market data displayed on this platform is sourced from third-party providers and may be delayed,
          incomplete, or inaccurate. We are not responsible for losses arising from data errors, delays,
          or service interruptions.
        </p>

        <p style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', color: '#4a5568', fontSize: 13 }}>
          Questions? Contact us through your account dashboard. See also our{' '}
          <Link href="/terms" style={{ color: '#00e5a0' }}>Terms of Service</Link> and{' '}
          <Link href="/privacy" style={{ color: '#00e5a0' }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
