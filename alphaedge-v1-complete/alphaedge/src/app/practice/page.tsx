'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TrendingUp, RotateCcw, ArrowLeft } from 'lucide-react'
import { ASSET_NAMES } from '@/lib/assets'
import type { Portfolio, PaperTrade } from '@/lib/paper'

// Practice portfolio: real prices, imaginary money. The teaching happens in
// the trade log — every fill records what AlphaEdge read at that moment, so
// a user can see their decisions next to the analysis afterwards.

const STANCE: Record<string, { label: string; color: string }> = {
  buy:   { label: 'BULLISH', color: 'var(--accent)' },
  sell:  { label: 'BEARISH', color: 'var(--red)' },
  watch: { label: 'NEUTRAL', color: 'var(--amber)' },
}

// Enough of each signal to decide a trade without leaving the page.
type TradeableSignal = {
  ticker: string
  price: number
  signal_type: string
  percent_change_24h: number | null
  entry_low: number | null
  entry_high: number | null
  target_price: number | null
  stop_loss: number | null
  rsi: number | null
  ath_change_pct: number | null
  simple_reasoning: string | null
}

function money(v: number) {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function price(p: number) {
  if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (p >= 1) return `$${p.toFixed(2)}`
  if (p >= 0.01) return `$${p.toFixed(4)}`
  return p > 0 ? `$${p.toPrecision(3)}` : '$0'
}
function qty(q: number) {
  return q >= 1 ? q.toLocaleString('en-US', { maximumFractionDigits: 4 }) : q.toPrecision(4)
}

export default function PracticePage() {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [trades, setTrades] = useState<PaperTrade[]>([])
  const [prices, setPrices] = useState<TradeableSignal[]>([])
  const [ticker, setTicker] = useState('BTC')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/paper')
    if (res.status === 401) { router.push('/auth'); return }
    if (res.status === 403) { router.push('/subscribe'); return }
    const d = await res.json()
    setPortfolio(d.portfolio ?? null)
    setTrades(d.trades ?? [])
    setLoaded(true)
  }, [router])

  useEffect(() => {
    load()
    // The tradeable list and its prices come from the live analysis.
    fetch('/api/signals')
      .then(r => (r.ok ? r.json() : { signals: [] }))
      .then(d => setPrices(
        (d.signals ?? [])
          .map((s: any): TradeableSignal => ({
            ticker: s.ticker,
            price: Number(s.price),
            signal_type: s.signal_type,
            percent_change_24h: s.percent_change_24h == null ? null : Number(s.percent_change_24h),
            entry_low: s.entry_low == null ? null : Number(s.entry_low),
            entry_high: s.entry_high == null ? null : Number(s.entry_high),
            target_price: s.target_price == null ? null : Number(s.target_price),
            stop_loss: s.stop_loss == null ? null : Number(s.stop_loss),
            rsi: s.rsi == null ? null : Number(s.rsi),
            ath_change_pct: s.ath_change_pct == null ? null : Number(s.ath_change_pct),
            simple_reasoning: s.simple_reasoning ?? null,
          }))
          .sort((a: TradeableSignal, b: TradeableSignal) => a.ticker.localeCompare(b.ticker)),
      ))
      .catch(() => {})
  }, [load])

  const selected = prices.find(p => p.ticker === ticker) ?? null
  const livePrice = selected?.price ?? null
  const liveStance = selected?.signal_type ?? null
  const held = portfolio?.holdings.find(h => h.ticker === ticker)?.quantity ?? 0
  const estimate = livePrice && Number(amount) > 0 ? Number(amount) * livePrice : null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setBusy(true)
    const res = await fetch('/api/paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, side, quantity: Number(amount) }),
    })
    const d = await res.json()
    setBusy(false)
    if (!res.ok) { setErr(d.error ?? 'Trade failed'); return }
    setPortfolio(d.portfolio); setTrades(d.trades); setAmount('')
  }

  async function reset() {
    if (!confirm('Reset your practice account back to $10,000? This clears every practice trade.')) return
    setBusy(true)
    const res = await fetch('/api/paper', { method: 'DELETE' })
    const d = await res.json()
    setBusy(false)
    if (res.ok) { setPortfolio(d.portfolio); setTrades(d.trades) }
  }

  if (!loaded || !portfolio) {
    return <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Loading practice account…</div>
  }

  const up = portfolio.total_pl >= 0
  const plColor = up ? 'var(--accent)' : 'var(--red)'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Practice</span>
        </div>
        <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={12} /> Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Practice portfolio
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Real prices, imaginary money. Nothing here touches a real account — it&apos;s a place to
            test what you&apos;d actually do before it costs anything.
          </p>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total value', value: money(portfolio.total_value), color: 'var(--text-primary)' },
            { label: 'Cash', value: money(portfolio.cash) },
            { label: 'Holdings', value: money(portfolio.holdings_value) },
            {
              label: 'Profit / loss',
              value: `${up ? '+' : '-'}${money(Math.abs(portfolio.total_pl))}`,
              sub: `${up ? '+' : ''}${portfolio.total_pl_pct.toFixed(2)}%`,
              color: plColor,
            },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              <div className="text-lg font-semibold" style={{ color: s.color ?? 'var(--text-primary)' }}>{s.value}</div>
              {s.sub && <div className="text-xs mt-0.5" style={{ color: plColor }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Trade ticket */}
        <form onSubmit={submit} className="p-4 rounded-xl mb-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex gap-2 mb-3">
            {(['buy', 'sell'] as const).map(s => (
              <button key={s} type="button" onClick={() => setSide(s)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: side === s ? (s === 'buy' ? 'var(--accent-dim)' : 'rgba(239,68,68,0.12)') : 'var(--bg-secondary)',
                  border: `1px solid ${side === s ? (s === 'buy' ? 'rgba(0,229,160,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--border)'}`,
                  color: side === s ? (s === 'buy' ? 'var(--accent)' : 'var(--red)') : 'var(--text-muted)',
                  cursor: 'pointer',
                }}>
                {s === 'buy' ? 'Buy' : 'Sell'}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <select value={ticker} onChange={e => setTicker(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', minWidth: 150 }}>
              {prices.map(p => (
                <option key={p.ticker} value={p.ticker}>
                  {p.ticker} — {ASSET_NAMES[p.ticker] ?? p.ticker}
                </option>
              ))}
            </select>
            <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal"
              placeholder="How many coins?"
              className="px-3 py-2 rounded-lg text-xs flex-1 min-w-[140px]"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            <button type="submit" disabled={busy || !amount}
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{
                background: 'var(--accent-dim)', border: '1px solid rgba(0,229,160,0.3)',
                color: 'var(--accent)', cursor: busy || !amount ? 'default' : 'pointer', opacity: busy || !amount ? 0.5 : 1,
              }}>
              {busy ? 'Working…' : side === 'buy' ? 'Buy' : 'Sell'}
            </button>
          </div>

          <div className="flex gap-3 flex-wrap mt-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            {livePrice != null && <span>Price {price(livePrice)}</span>}
            {liveStance && (
              <span>
                AlphaEdge reads it{' '}
                <span style={{ color: STANCE[liveStance]?.color }}>{STANCE[liveStance]?.label}</span>
              </span>
            )}
            {estimate != null && <span>≈ {money(estimate)}</span>}
            {side === 'sell' && <span>You hold {qty(held)}</span>}
          </div>

          {err && <p className="text-xs mt-2" style={{ color: 'var(--red)' }}>{err}</p>}
        </form>

        {/* What AlphaEdge currently reads on the selected coin, so a decision
            can be made here rather than by flipping back to the dashboard. */}
        {selected && (
          <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                {selected.ticker}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {ASSET_NAMES[selected.ticker] ?? 'Cryptocurrency'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ background: 'var(--bg-secondary)', color: STANCE[selected.signal_type]?.color }}>
                {STANCE[selected.signal_type]?.label}
              </span>
              {selected.percent_change_24h != null && (
                <span className="text-xs ml-auto"
                  style={{ color: selected.percent_change_24h >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                  {selected.percent_change_24h >= 0 ? '+' : ''}{selected.percent_change_24h.toFixed(2)}% today
                </span>
              )}
            </div>

            {selected.simple_reasoning && (
              <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                {selected.simple_reasoning}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {selected.entry_low != null && selected.entry_high != null && (
                <div className="p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Buy-in zone</div>
                  <div className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {price(selected.entry_low)} – {price(selected.entry_high)}
                  </div>
                </div>
              )}
              {selected.target_price != null && (
                <div className="p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Price target</div>
                  <div className="font-medium mt-0.5" style={{ color: 'var(--accent)' }}>
                    {price(selected.target_price)}
                  </div>
                </div>
              )}
              {selected.stop_loss != null && (
                <div className="p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Get-out level</div>
                  <div className="font-medium mt-0.5" style={{ color: 'var(--red)' }}>
                    {price(selected.stop_loss)}
                  </div>
                </div>
              )}
              {selected.ath_change_pct != null && (
                <div className="p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>vs record high</div>
                  <div className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {Math.abs(selected.ath_change_pct).toFixed(0)}% below
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Educational analysis, not advice — and practising against it is the point. If you
              disagree with this read, take the other side and see what happens.
            </p>
          </div>
        )}

        {/* Holdings */}
        <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Holdings</h2>
          {portfolio.holdings.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Nothing held yet. Buy something above — you have {money(portfolio.cash)} of practice money to work with.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {portfolio.holdings.map(h => {
                const gain = (h.unrealized_pl ?? 0) >= 0
                return (
                  <div key={h.ticker} className="flex items-center gap-2 flex-wrap text-xs py-1.5"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)', minWidth: 56 }}>{h.ticker}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{qty(h.quantity)} @ {price(h.avg_cost)}</span>
                    {h.current_price != null && <span style={{ color: 'var(--text-secondary)' }}>now {price(h.current_price)}</span>}
                    <span className="ml-auto font-semibold" style={{ color: gain ? 'var(--accent)' : 'var(--red)' }}>
                      {h.unrealized_pl != null
                        ? `${gain ? '+' : '-'}${money(Math.abs(h.unrealized_pl))} (${gain ? '+' : ''}${h.unrealized_pl_pct?.toFixed(1)}%)`
                        : 'awaiting price'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Trade log — the actual teaching surface */}
        <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Your trades</h2>
            {portfolio.realized_pl !== 0 && (
              <span className="text-xs" style={{ color: portfolio.realized_pl >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                Banked: {portfolio.realized_pl >= 0 ? '+' : '-'}{money(Math.abs(portfolio.realized_pl))}
              </span>
            )}
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Each trade records what the analysis said at that moment — the useful part is comparing
            it against what you decided.
          </p>
          {trades.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No trades yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {trades.map(t => (
                <div key={t.id} className="flex items-center gap-2 flex-wrap text-xs py-1">
                  <span className="font-semibold" style={{ color: t.side === 'buy' ? 'var(--accent)' : 'var(--red)', minWidth: 34 }}>
                    {t.side === 'buy' ? 'BUY' : 'SELL'}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>{qty(t.quantity)} {t.ticker}</span>
                  <span style={{ color: 'var(--text-muted)' }}>@ {price(t.price)}</span>
                  {t.signal_at_trade && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      · read{' '}
                      <span style={{ color: STANCE[t.signal_at_trade]?.color }}>
                        {STANCE[t.signal_at_trade]?.label}
                      </span>
                    </span>
                  )}
                  <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={reset} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <RotateCcw size={12} /> Start over at $10,000
          </button>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Practice only — no real money, and results here don&apos;t predict real ones.
          </p>
        </div>
      </main>
    </div>
  )
}
