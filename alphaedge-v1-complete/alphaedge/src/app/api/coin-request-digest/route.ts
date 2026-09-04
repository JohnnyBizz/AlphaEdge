import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TRACKED_COIN_KEYS } from '@/lib/assets'
import { SITE_URL as APP_URL } from '@/lib/seo'

// ── Weekly coin-request digest ────────────────────────────
// Tallies every outstanding subscriber request and emails the top 3 to the
// founder. Coins are counted by their normalised key, so spelling variants
// collapse into one total. Nothing is deleted after sending: once a coin is
// added to CRYPTO_ASSETS it drops out of the tally on its own, which keeps
// the standings cumulative and self-cleaning.

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'johnnyboy0207@gmail.com'

type Row = { coin: string; coin_key: string; user_id: string; created_at: string }

type Tally = { key: string; label: string; votes: number; newest: string }

function tally(rows: Row[]): Tally[] {
  const byKey = new Map<string, { voters: Set<string>; labels: Map<string, number>; newest: string }>()

  for (const r of rows) {
    if (TRACKED_COIN_KEYS.has(r.coin_key)) continue // already on the platform
    let e = byKey.get(r.coin_key)
    if (!e) { e = { voters: new Set(), labels: new Map(), newest: r.created_at }; byKey.set(r.coin_key, e) }
    e.voters.add(r.user_id)
    e.labels.set(r.coin, (e.labels.get(r.coin) ?? 0) + 1)
    if (r.created_at > e.newest) e.newest = r.created_at
  }

  return Array.from(byKey.entries())
    .map(([key, e]) => ({
      key,
      // Show the spelling most people used, not whoever asked first.
      label: Array.from(e.labels.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
      votes: e.voters.size,
      newest: e.newest,
    }))
    // Ties break toward the request that's been waiting longest.
    .sort((a, b) => b.votes - a.votes || a.newest.localeCompare(b.newest))
}

function buildEmail(top: Tally[], rest: Tally[], totalVoters: number) {
  const row = (t: Tally, i: number) => `
    <tr>
      <td style="padding:10px 12px;font-size:15px;color:#111827;font-weight:700;">${i + 1}. ${t.label}</td>
      <td style="padding:10px 12px;font-size:15px;color:#059669;font-weight:700;text-align:right;">
        ${t.votes} vote${t.votes === 1 ? '' : 's'}
      </td>
    </tr>`

  const restLines = rest.length > 0 ? `
    <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:22px 0 8px;">
      Also requested
    </div>
    <div style="font-size:13px;color:#374151;line-height:1.8;">
      ${rest.map(t => `${t.label} <span style="color:#9ca3af;">(${t.votes})</span>`).join(' · ')}
    </div>` : ''

  const html = `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px;">
    <div style="font-size:18px;font-weight:800;color:#111827;margin-bottom:4px;">🗳️ Coin requests this week</div>
    <div style="font-size:12px;color:#6b7280;margin-bottom:18px;">
      ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
    </div>
    <div style="background:#ffffff;border-radius:12px;padding:20px;">
      <div style="font-size:14px;color:#374151;line-height:1.6;">
        ${totalVoters} paying subscriber${totalVoters === 1 ? '' : 's'} have requested coins.
        Here are the top ${top.length}:
      </div>
      <table style="border-collapse:collapse;width:100%;margin-top:14px;">
        ${top.map(row).join('')}
      </table>
      ${restLines}
      <div style="font-size:12px;color:#6b7280;line-height:1.6;margin-top:22px;">
        To add one: put it in <code>src/lib/assets.ts</code> with its CoinGecko id.
        Added coins drop off this list automatically.
      </div>
      <a href="${APP_URL}/dashboard"
        style="display:inline-block;background:#059669;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:8px;margin-top:18px;">
        Open dashboard →
      </a>
    </div>
  </div>
</body>
</html>`

  const text = `Coin requests this week\n\n` +
    `${totalVoters} paying subscriber(s) have requested coins.\n\n` +
    top.map((t, i) => `${i + 1}. ${t.label} — ${t.votes} vote(s)`).join('\n') +
    (rest.length ? `\n\nAlso: ${rest.map(t => `${t.label} (${t.votes})`).join(', ')}` : '') +
    `\n\nAdd one in src/lib/assets.ts with its CoinGecko id.`

  return { html, text }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ sent: false, skipped: 'RESEND_API_KEY not set' })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('coin_requests')
    .select('coin, coin_key, user_id, created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ranked = tally((data ?? []) as Row[])
  if (ranked.length === 0) {
    return NextResponse.json({ sent: false, skipped: 'no outstanding requests' })
  }

  const top = ranked.slice(0, 3)
  const rest = ranked.slice(3, 15)
  const totalVoters = new Set((data ?? []).map((r: Row) => r.user_id)).size
  const { html, text } = buildEmail(top, rest, totalVoters)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: 'AlphaEdge <alerts@alphaedge.network>',
      to: [ADMIN_EMAIL],
      subject: `Coin requests: ${top.map(t => t.label).join(', ')}`,
      html,
      text,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    console.error('Coin-request digest failed:', res.status, detail.slice(0, 200))
    return NextResponse.json({ sent: false, error: 'Email send failed' }, { status: 502 })
  }

  return NextResponse.json({ sent: true, top, candidates: ranked.length, voters: totalVoters })
}
