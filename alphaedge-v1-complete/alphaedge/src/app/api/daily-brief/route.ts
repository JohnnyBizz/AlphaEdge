import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { setupLine } from '@/lib/alerts'

// ── Daily market brief ────────────────────────────────────
// Once a day (vercel.json cron), sends every active subscriber a short
// plain-English summary of the market: biggest movers, signal changes in
// the last 24h, and an AI-written overview. Built entirely from data the
// scheduled refresh already produces — one extra AI call per day total.

export const maxDuration = 120

const APP_URL = 'https://www.alphaedge.network'

type SignalRow = {
  ticker: string; market: string; signal_type: string
  price: number; percent_change_24h: number | null; simple_reasoning: string | null
  entry_low: number | null; entry_high: number | null
  target_price: number | null; stop_loss: number | null
}
type HistoryRow = { ticker: string; signal_type: string; previous_type: string | null; generated_at: string }

const LABELS: Record<string, string> = { buy: 'BULLISH', sell: 'BEARISH', watch: 'NEUTRAL' }
const COLORS: Record<string, string> = { buy: '#059669', sell: '#dc2626', watch: '#d97706' }

function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` }

async function writeBrief(signals: SignalRow[], changes: HistoryRow[]): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const movers = signals
    .filter(s => s.percent_change_24h != null)
    .sort((a, b) => Math.abs(b.percent_change_24h!) - Math.abs(a.percent_change_24h!))
    .slice(0, 8)

  const prompt = `Write a 4-5 sentence morning market brief for everyday people (no trading jargon).
Cover the overall mood and the most notable movers/changes. Be factual and neutral — this is
educational information, not advice. Do not use the words RSI, MACD, SMA, or Bollinger.

Biggest 24h movers:
${movers.map(s => `${s.ticker}: ${fmtPct(s.percent_change_24h!)} (stance: ${LABELS[s.signal_type]})`).join('\n')}

Stance changes in the last 24h:
${changes.length > 0
  ? changes.map(c => `${c.ticker}: ${c.previous_type ? LABELS[c.previous_type] : 'new'} -> ${LABELS[c.signal_type]}`).join('\n')
  : 'none'}

Return ONLY the brief text, no headings or preamble.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 400,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: prompt }],
  })
  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}

function buildEmail(brief: string, signals: SignalRow[], changes: HistoryRow[]) {
  const sorted = signals.filter(s => s.percent_change_24h != null)
    .sort((a, b) => b.percent_change_24h! - a.percent_change_24h!)
  const gainers = sorted.slice(0, 3)
  const losers = sorted.slice(-3).reverse()
  const byTicker = new Map(signals.map(s => [s.ticker, s]))

  const moverRow = (s: SignalRow) => `
    <td style="padding:6px 10px;font-size:13px;color:#111827;">
      <strong>${s.ticker}</strong>
      <span style="color:${(s.percent_change_24h ?? 0) >= 0 ? '#059669' : '#dc2626'};font-weight:700;margin-left:6px;">
        ${fmtPct(s.percent_change_24h!)}
      </span>
    </td>`

  const changeLines = changes.slice(0, 6).map(c => {
    const current = byTicker.get(c.ticker)
    const setup = current ? setupLine(current) : null
    return `
    <div style="font-size:13px;color:#374151;margin-top:6px;">
      <strong>${c.ticker}</strong> is now
      <span style="color:${COLORS[c.signal_type] ?? '#d97706'};font-weight:700;">${LABELS[c.signal_type]}</span>
      ${c.previous_type ? `<span style="color:#6b7280;">(was ${LABELS[c.previous_type]})</span>` : ''}
      ${setup ? `<div style="font-size:12px;color:#065f46;background:#ecfdf5;border-radius:6px;padding:8px 10px;margin-top:5px;">${setup}</div>` : ''}
    </div>`
  }).join('')

  const html = `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px;">
    <div style="font-size:18px;font-weight:800;color:#111827;margin-bottom:4px;">📈 AlphaEdge Daily Brief</div>
    <div style="font-size:12px;color:#6b7280;margin-bottom:18px;">
      ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
    </div>
    <div style="background:#ffffff;border-radius:12px;padding:20px;">
      <div style="font-size:14px;color:#374151;line-height:1.6;">${brief}</div>

      <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:18px 0 6px;">Movers (24h)</div>
      <table style="border-collapse:collapse;"><tr>${gainers.map(moverRow).join('')}</tr><tr>${losers.map(moverRow).join('')}</tr></table>

      ${changes.length > 0 ? `
      <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:18px 0 2px;">Stance changes</div>
      ${changeLines}` : ''}

      <a href="${APP_URL}/dashboard"
        style="display:inline-block;background:#059669;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:8px;margin-top:18px;">
        Open your dashboard →
      </a>
    </div>
    <div style="font-size:11px;color:#9ca3af;margin-top:18px;line-height:1.5;">
      Educational information only — not financial advice. Trading involves substantial risk of loss.<br/><br/>
      You receive this daily brief as part of your AlphaEdge subscription.
      Manage your subscription from your <a href="${APP_URL}/dashboard" style="color:#6b7280;">dashboard</a>.
    </div>
  </div>
</body>
</html>`

  const text = `AlphaEdge Daily Brief\n\n${brief}\n\n` +
    `Gainers: ${gainers.map(s => `${s.ticker} ${fmtPct(s.percent_change_24h!)}`).join(', ')}\n` +
    `Losers: ${losers.map(s => `${s.ticker} ${fmtPct(s.percent_change_24h!)}`).join(', ')}\n\n` +
    `Dashboard: ${APP_URL}/dashboard\n\nEducational information only — not financial advice.`

  return { html, text }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ sent: 0, skipped: 'RESEND_API_KEY not set' })

  const supabase = createAdminClient()

  // Recipients: users with a live subscription
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id, status, current_period_end')
    .in('status', ['active', 'trialing'])
    .gt('current_period_end', new Date().toISOString())
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0, skipped: 'no active subscribers' })

  // Content inputs
  const { data: signals } = await supabase
    .from('signals')
    .select('ticker, market, signal_type, price, percent_change_24h, simple_reasoning, entry_low, entry_high, target_price, stop_loss')
    .gt('expires_at', new Date().toISOString())
  if (!signals || signals.length === 0) return NextResponse.json({ sent: 0, skipped: 'no cached signals' })

  const { data: changes } = await supabase
    .from('signal_history')
    .select('ticker, signal_type, previous_type, generated_at')
    .gt('generated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('generated_at', { ascending: false })

  const brief = await writeBrief(
    (signals as SignalRow[]).map(s => ({ ...s, price: Number(s.price) })),
    (changes ?? []) as HistoryRow[]
  )
  if (!brief) return NextResponse.json({ sent: 0, skipped: 'brief generation failed' })

  const { html, text } = buildEmail(brief, signals as SignalRow[], (changes ?? []) as HistoryRow[])
  const subject = `Daily brief: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — markets in plain English`

  let sent = 0
  for (const sub of subs) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id)
      const email = userData?.user?.email
      if (!email) continue
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          from: 'AlphaEdge Daily Brief <alerts@alphaedge.network>',
          to: [email],
          subject,
          html,
          text,
        }),
      })
      if (res.ok) sent++
      else console.error(`Daily brief failed for ${email}: ${res.status}`)
    } catch (err) {
      console.error(`Daily brief failed for user ${sub.user_id}:`, err)
    }
  }

  return NextResponse.json({ sent, subscribers: subs.length })
}
