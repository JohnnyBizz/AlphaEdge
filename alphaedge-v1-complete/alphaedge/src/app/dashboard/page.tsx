'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, RefreshCw, LogOut, BarChart2, Bitcoin, Building2, Eye, Settings, CreditCard,
} from 'lucide-react'

type Signal = {
  id: string; ticker: string; market: 'stock' | 'crypto'
  signal_type: 'buy' | 'sell' | 'watch'; confidence: number; price: number
  entry_low: number | null; entry_high: number | null; target_price: number | null
  stop_loss: number | null; rsi: number | null; macd_signal: string | null
  volume_ratio: number | null; ai_reasoning: string; generated_at: string
}

type Filter = 'all' | 'stock' | 'crypto' | 'buy' | 'sell'

type Position = {
  id: string; ticker: string; market: 'stock' | 'crypto'
  quantity: number; entry_price: number; created_at: string
}

function formatPrice(p: number) {
  if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (p >= 1) return `$${p.toFixed(2)}`
  return `$${p.toFixed(4)}`
}

function SignalBadge({ type }: { type: 'buy' | 'sell' | 'watch' }) {
  const styles = {
    buy: { bg: 'var(--accent-dim)', color: 'var(--accent)', label: 'BULLISH' },
    sell: { bg: 'var(--red-dim)', color: 'var(--red)', label: 'BEARISH' },
    watch: { bg: 'var(--amber-dim)', color: 'var(--amber)', label: 'NEUTRAL' },
  }
  const s = styles[type]
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function PositionsSection({ signals }: { signals: Signal[] }) {
  const [positions, setPositions] = useState<Position[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [ticker, setTicker] = useState('')
  const [qty, setQty] = useState('')
  const [entry, setEntry] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/positions')
      .then(r => r.json())
      .then(d => { setPositions(d.positions ?? []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  const bySignal = new Map(signals.map(s => [s.ticker, s]))
  const assetOptions = signals
    .map(s => ({ ticker: s.ticker, market: s.market }))
    .sort((a, b) => a.ticker.localeCompare(b.ticker))

  async function addPosition(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const asset = assetOptions.find(a => a.ticker === ticker)
    if (!asset) { setFormError('Pick an asset'); return }
    setSaving(true)
    const res = await fetch('/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: asset.ticker, market: asset.market, quantity: qty, entry_price: entry }),
    })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) { setFormError(d.error ?? 'Could not save position'); return }
    setPositions(p => [...p, d.position])
    setTicker(''); setQty(''); setEntry(''); setShowForm(false)
  }

  async function removePosition(id: string) {
    setPositions(p => p.filter(x => x.id !== id))
    await fetch(`/api/positions?id=${id}`, { method: 'DELETE' }).catch(() => {})
  }

  if (!loaded) return null

  const totals = positions.reduce((acc, p) => {
    const sig = bySignal.get(p.ticker)
    if (!sig) return acc
    acc.cost += p.quantity * p.entry_price
    acc.value += p.quantity * sig.price
    return acc
  }, { cost: 0, value: 0 })
  const totalPl = totals.value - totals.cost
  const totalPlPct = totals.cost > 0 ? (totalPl / totals.cost) * 100 : 0
  const plColor = (v: number) => v >= 0 ? 'var(--accent)' : 'var(--red)'

  return (
    <div className="mb-6 rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>My Positions</h2>
          {positions.length > 0 && totals.cost > 0 && (
            <span className="text-xs font-semibold" style={{ color: plColor(totalPl) }}>
              {totalPl >= 0 ? '+' : ''}{formatPrice(Math.abs(totalPl)).replace('$', '$')}{' '}
              ({totalPl >= 0 ? '+' : ''}{totalPlPct.toFixed(1)}%)
            </span>
          )}
        </div>
        <button onClick={() => setShowForm(f => !f)}
          className="px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'var(--accent-dim)', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}>
          {showForm ? 'Close' : '+ Add position'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addPosition} className="flex flex-wrap items-end gap-2 mb-4 p-3 rounded-lg"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Asset</label>
            <select value={ticker} onChange={e => setTicker(e.target.value)} required
              className="px-2 py-2 rounded-lg text-xs outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <option value="">Select…</option>
              {assetOptions.map(a => (
                <option key={a.ticker} value={a.ticker}>{a.ticker} ({a.market})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Quantity</label>
            <input type="number" step="any" min="0" value={qty} onChange={e => setQty(e.target.value)}
              placeholder="e.g. 10" required
              className="w-28 px-2 py-2 rounded-lg text-xs outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Entry price ($)</label>
            <input type="number" step="any" min="0" value={entry} onChange={e => setEntry(e.target.value)}
              placeholder="e.g. 180.50" required
              className="w-28 px-2 py-2 rounded-lg text-xs outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--accent)', color: '#0a0d12', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Add'}
          </button>
          {formError && <span className="text-xs" style={{ color: 'var(--red)' }}>{formError}</span>}
        </form>
      )}

      {positions.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Track what you own — add a position and see its live value and current analysis alongside the market board.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {positions.map(p => {
            const sig = bySignal.get(p.ticker)
            const current = sig?.price ?? null
            const pl = current !== null ? (current - p.entry_price) * p.quantity : null
            const plPct = current !== null ? ((current / p.entry_price) - 1) * 100 : null
            return (
              <div key={p.id} className="flex items-center gap-3 flex-wrap p-3 rounded-lg"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="w-16 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.ticker}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {p.quantity} @ {formatPrice(p.entry_price)}
                </div>
                {current !== null && pl !== null && plPct !== null ? (
                  <>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      now {formatPrice(current)}
                    </div>
                    <div className="text-xs font-semibold" style={{ color: plColor(pl) }}>
                      {pl >= 0 ? '+' : '-'}{formatPrice(Math.abs(pl)).replace('$', '$')} ({plPct >= 0 ? '+' : ''}{plPct.toFixed(1)}%)
                    </div>
                    {sig && (
                      <div className="flex items-center gap-2 ml-auto">
                        <SignalBadge type={sig.signal_type} />
                        <span className="text-xs hidden md:inline" style={{ color: 'var(--text-muted)' }}>
                          RSI {sig.rsi ?? '—'}{sig.macd_signal ? ` · MACD ${sig.macd_signal.replace(/_/g, ' ')}` : ''}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>awaiting analysis refresh</span>
                )}
                <button onClick={() => removePosition(p.id)} title="Remove position"
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            )
          })}
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Position values update with each hourly analysis refresh. Informational only — not financial advice.
          </p>
        </div>
      )}
    </div>
  )
}

function ConfidenceBar({ value, type }: { value: number; type: string }) {
  const color = type === 'buy' ? 'var(--accent)' : type === 'sell' ? 'var(--red)' : 'var(--amber)'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{value}%</span>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
      <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-2xl font-semibold" style={{ color: color ?? 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)

  const fetchSignals = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/signals')
      if (res.status === 401 || res.status === 403) { router.push('/auth'); return }
      if (!res.ok) throw new Error('Failed to fetch analysis')
      const data = await res.json()
      setSignals(data.signals ?? [])
      setLastUpdated(new Date())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      fetchSignals()
    })
  }, [supabase, router, fetchSignals])

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchSignals(true), 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSignals])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  async function handleBilling() {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (url) { window.location.href = url; return }
      setError(error ?? 'Could not open the billing portal')
    } catch {
      setError('Could not open the billing portal')
    }
    setBillingLoading(false)
  }

  const filtered = signals.filter(s => {
    if (filter === 'all') return true
    if (filter === 'stock' || filter === 'crypto') return s.market === filter
    return s.signal_type === filter
  })

  const buys = signals.filter(s => s.signal_type === 'buy').length
  const sells = signals.filter(s => s.signal_type === 'sell').length
  const avgConf = signals.length ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length) : 0
  const bullish = buys > sells

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 sticky top-0 z-10"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <TrendingUp size={14} color="var(--accent)" />
          </div>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>AlphaEdge</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: 'var(--accent)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
            Live
          </div>
          {lastUpdated && (
            <span className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Link href="/onboarding" title="Update trading profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <Settings size={12} />
            <span className="hidden md:inline">Profile</span>
          </Link>
          <button onClick={handleBilling} disabled={billingLoading} title="Manage billing or cancel subscription"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <CreditCard size={12} />
            <span className="hidden md:inline">{billingLoading ? 'Opening…' : 'Billing'}</span>
          </button>
          <button onClick={() => fetchSignals(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <LogOut size={12} />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Market Analysis</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            AI technical analysis across stocks and crypto — for educational purposes
          </p>
        </div>

        {/* Stats row — factual metrics only */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Bullish setups" value={String(buys)} sub={`${signals.length} assets analyzed`} color="var(--accent)" />
          <StatCard label="Bearish setups" value={String(sells)} sub="Distribution patterns" color="var(--red)" />
          <StatCard label="Avg confidence" value={`${avgConf}%`} sub="Across current analysis" />
          <StatCard label="Market breadth" value={bullish ? 'Bullish' : 'Bearish'}
            sub={`${buys} bullish vs ${sells} bearish`}
            color={bullish ? 'var(--accent)' : 'var(--red)'} />
        </div>

        {/* My Positions */}
        <PositionsSection signals={signals} />

        {/* Filter pills */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {([
            { key: 'all', label: 'All' },
            { key: 'buy', label: 'Bullish' },
            { key: 'sell', label: 'Bearish' },
            { key: 'stock', label: 'Stocks' },
            { key: 'crypto', label: 'Crypto' },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs transition-all"
              style={{
                background: filter === f.key ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                border: `1px solid ${filter === f.key ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                color: filter === f.key ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 rounded-xl mb-4 text-sm" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(240,74,74,0.2)' }}>
            {error} — <button onClick={() => fetchSignals()} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="p-5 rounded-xl animate-pulse"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', height: 180 }} />
            ))}
          </div>
        )}

        {/* Signal cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(signal => (
              <div key={signal.id}
                className="p-5 rounded-xl cursor-pointer transition-all fade-in"
                onClick={() => setSelectedSignal(selectedSignal?.id === signal.id ? null : signal)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${selectedSignal?.id === signal.id ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {signal.market === 'crypto'
                        ? <Bitcoin size={14} color="var(--text-muted)" />
                        : <Building2 size={14} color="var(--text-muted)" />}
                      <span className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                        {signal.ticker}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {signal.market === 'crypto' ? 'Cryptocurrency' : 'Stock'}
                    </div>
                  </div>
                  <SignalBadge type={signal.signal_type} />
                </div>

                <div className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  {formatPrice(signal.price)}
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--text-muted)' }}>Analysis confidence</span>
                  </div>
                  <ConfidenceBar value={signal.confidence} type={signal.signal_type} />
                </div>

                <div className="flex gap-3 text-xs mb-3">
                  {signal.rsi !== null && (
                    <span style={{ color: signal.rsi > 70 ? 'var(--red)' : signal.rsi < 30 ? 'var(--accent)' : 'var(--text-muted)' }}>
                      RSI {signal.rsi}
                    </span>
                  )}
                  {signal.macd_signal && (
                    <span style={{ color: signal.macd_signal.includes('bullish') ? 'var(--accent)' : signal.macd_signal.includes('bearish') ? 'var(--red)' : 'var(--text-muted)' }}>
                      MACD {signal.macd_signal.replace('_', ' ')}
                    </span>
                  )}
                  {signal.volume_ratio && (
                    <span style={{ color: signal.volume_ratio > 1.5 ? 'var(--accent)' : 'var(--text-muted)' }}>
                      Vol {signal.volume_ratio}x
                    </span>
                  )}
                </div>

                {selectedSignal?.id === signal.id && (
                  <div className="mt-4 pt-4 fade-in" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {signal.ai_reasoning}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {signal.entry_low && signal.entry_high && (
                        <div className="p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                          <div style={{ color: 'var(--text-muted)' }}>Support zone</div>
                          <div className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                            {formatPrice(signal.entry_low)} – {formatPrice(signal.entry_high)}
                          </div>
                        </div>
                      )}
                      {signal.target_price && (
                        <div className="p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                          <div style={{ color: 'var(--text-muted)' }}>Next resistance</div>
                          <div className="font-medium mt-0.5" style={{ color: 'var(--accent)' }}>
                            {formatPrice(signal.target_price)}
                          </div>
                        </div>
                      )}
                      {signal.stop_loss && (
                        <div className="p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                          <div style={{ color: 'var(--text-muted)' }}>Key support break</div>
                          <div className="font-medium mt-0.5" style={{ color: 'var(--red)' }}>
                            {formatPrice(signal.stop_loss)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Generated {new Date(signal.generated_at).toLocaleTimeString()} · Educational analysis, not advice
                    </div>
                  </div>
                )}

                {selectedSignal?.id !== signal.id && (
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Eye size={11} />
                    Click for full analysis
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && !error && (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
            <p>No analysis matches this filter.</p>
          </div>
        )}

        {/* Disclaimer with legal links */}
        <div className="mt-8 p-4 rounded-xl text-xs" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Disclaimer:</strong> AlphaEdge analysis is for
          informational and educational purposes only and does not constitute financial advice. Trading and
          investing involve substantial risk of loss. Past performance is not indicative of future results.
          Always do your own research and consult a qualified financial advisor before making any investment
          decisions.{' '}
          <Link href="/terms" style={{ color: 'var(--accent)' }}>Terms</Link>
          {' · '}
          <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy</Link>
          {' · '}
          <Link href="/disclaimer" style={{ color: 'var(--accent)' }}>Full disclaimer</Link>
        </div>
      </div>
    </div>
  )
}
