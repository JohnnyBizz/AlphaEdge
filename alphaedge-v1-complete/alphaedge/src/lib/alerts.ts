// ── Signal-change email alerts (via Resend) ──────────────
// After each signal refresh, users holding positions in assets whose
// signal flipped (e.g. NEUTRAL → BEARISH) get one email summarizing
// the changes to their holdings. Fails silently (logged) so email
// problems can never break signal generation.

import { createAdminClient } from './supabase/admin'
import type { GeneratedSignal } from './signal-engine'

const LABELS: Record<string, { text: string; color: string }> = {
  buy: { text: 'BULLISH', color: '#059669' },
  sell: { text: 'BEARISH', color: '#dc2626' },
  watch: { text: 'NEUTRAL', color: '#d97706' },
}

const APP_URL = 'https://www.alphaedge.network'

type PositionRow = { user_id: string; ticker: string; quantity: number; entry_price: number }

function fmt(p: number) {
  if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (p >= 1) return `$${p.toFixed(2)}`
  return `$${p.toFixed(4)}`
}

function assetCard(sig: GeneratedSignal, prevType: string, positions: PositionRow[]) {
  const now = LABELS[sig.signal_type] ?? LABELS.watch
  const was = LABELS[prevType] ?? LABELS.watch
  const posLines = positions.map(p => {
    const plPct = ((sig.price / p.entry_price) - 1) * 100
    const sign = plPct >= 0 ? '+' : ''
    const color = plPct >= 0 ? '#059669' : '#dc2626'
    return `<div style="font-size:13px;color:#374151;margin-top:6px;">
      Your position: ${p.quantity} @ ${fmt(p.entry_price)} —
      <strong style="color:${color};">${sign}${plPct.toFixed(1)}%</strong> at the current price of ${fmt(sig.price)}
    </div>`
  }).join('')

  return `
  <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px 18px;margin-bottom:14px;">
    <div style="display:flex;align-items:center;">
      <span style="font-size:17px;font-weight:700;color:#111827;">${sig.ticker}</span>
      <span style="margin-left:10px;font-size:11px;font-weight:700;color:#ffffff;background:${now.color};padding:3px 8px;border-radius:5px;">${now.text}</span>
      <span style="margin-left:8px;font-size:12px;color:#6b7280;">was ${was.text}</span>
    </div>
    ${posLines}
    ${sig.ai_reasoning ? `<div style="font-size:13px;color:#4b5563;margin-top:10px;border-left:3px solid #e5e7eb;padding-left:10px;">${sig.ai_reasoning}</div>` : ''}
  </div>`
}

function buildEmail(changes: { sig: GeneratedSignal; prevType: string; positions: PositionRow[] }[]) {
  const cards = changes.map(c => assetCard(c.sig, c.prevType, c.positions)).join('')
  const html = `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px;">
    <div style="font-size:18px;font-weight:800;color:#111827;margin-bottom:4px;">📈 AlphaEdge</div>
    <div style="font-size:14px;color:#4b5563;margin-bottom:18px;">
      The AI analysis changed on ${changes.length === 1 ? 'an asset you hold' : `${changes.length} assets you hold`}:
    </div>
    <div style="background:#ffffff;border-radius:12px;padding:18px;">
      ${cards}
      <a href="${APP_URL}/dashboard"
        style="display:inline-block;background:#059669;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:8px;margin-top:4px;">
        View full analysis →
      </a>
    </div>
    <div style="font-size:11px;color:#9ca3af;margin-top:18px;line-height:1.5;">
      AlphaEdge analysis is for informational and educational purposes only and does not constitute
      financial advice. Trading involves substantial risk of loss.<br/><br/>
      You received this because you track ${changes.length === 1 ? 'this asset' : 'these assets'} in
      My Positions on AlphaEdge. Remove the position from your
      <a href="${APP_URL}/dashboard" style="color:#6b7280;">dashboard</a> to stop these alerts.
    </div>
  </div>
</body>
</html>`

  const text = changes.map(c => {
    const now = LABELS[c.sig.signal_type]?.text ?? 'NEUTRAL'
    const was = LABELS[c.prevType]?.text ?? 'NEUTRAL'
    return `${c.sig.ticker}: ${was} -> ${now} (current price ${fmt(c.sig.price)})`
  }).join('\n') + `\n\nView full analysis: ${APP_URL}/dashboard\n\nEducational analysis only — not financial advice.`

  const subject = changes.length === 1
    ? `${changes[0].sig.ticker} signal changed: now ${LABELS[changes[0].sig.signal_type]?.text}`
    : `Signal changes on ${changes.length} assets you hold`

  return { subject, html, text }
}

export async function sendSignalChangeAlerts(
  previous: Map<string, string>,
  fresh: GeneratedSignal[],
) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return // alerts disabled until the key is configured

  const changed = fresh.filter(s => {
    const prev = previous.get(s.ticker)
    return prev !== undefined && prev !== s.signal_type
  })
  if (changed.length === 0) return

  const supabase = createAdminClient()
  const { data: positions } = await supabase
    .from('positions')
    .select('user_id, ticker, quantity, entry_price')
    .in('ticker', changed.map(c => c.ticker))
  if (!positions || positions.length === 0) return

  // Group affected positions by user
  const byUser = new Map<string, PositionRow[]>()
  for (const p of positions as PositionRow[]) {
    const list = byUser.get(p.user_id) ?? []
    list.push(p)
    byUser.set(p.user_id, list)
  }

  for (const [userId, userPositions] of Array.from(byUser.entries())) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId)
      const email = userData?.user?.email
      if (!email) continue

      const changes = changed
        .filter(sig => userPositions.some((p: PositionRow) => p.ticker === sig.ticker))
        .map(sig => ({
          sig,
          prevType: previous.get(sig.ticker)!,
          positions: userPositions.filter((p: PositionRow) => p.ticker === sig.ticker),
        }))
      if (changes.length === 0) continue

      const { subject, html, text } = buildEmail(changes)

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          from: 'AlphaEdge Alerts <alerts@alphaedge.network>',
          to: [email],
          subject,
          html,
          text,
        }),
      })
      if (!res.ok) {
        console.error(`Alert email failed for ${email}: ${res.status} ${(await res.text()).slice(0, 200)}`)
      }
    } catch (err) {
      console.error(`Alert processing failed for user ${userId}:`, err)
    }
  }
}
