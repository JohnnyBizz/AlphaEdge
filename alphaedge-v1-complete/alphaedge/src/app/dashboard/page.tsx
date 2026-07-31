'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import SignalChart from '@/components/SignalChart'
import GlossaryText from '@/components/GlossaryText'
import PushToggle from '@/components/PushToggle'
import { ASSET_NAMES } from '@/lib/assets'
import {
  fitsProfile, sortSignals, defaultSortFor, zoneDistancePct,
  SORT_LABELS, type SortKey, type TraderProfile,
} from '@/lib/fit'
import {
  TrendingUp, RefreshCw, LogOut, BarChart2, Bitcoin, Eye, Settings, CreditCard, BookOpen, History, Wallet,
} from 'lucide-react'

type Signal = {
  id: string; ticker: string; market: 'stock' | 'crypto'
  signal_type: 'buy' | 'sell' | 'watch'; confidence: number; price: number
  entry_low: number | null; entry_high: number | null; target_price: number | null
  stop_loss: number | null; rsi: number | null; macd_signal: string | null
  volume_ratio: number | null; ai_reasoning: string; generated_at: string
  simple_reasoning: string | null
  chart_closes: { t: number; c: number; m?: number }[] | null
  percent_change_24h: number | null
  ath_change_pct: number | null
  ath_price: number | null
}

type Filter = 'all' | 'buy' | 'sell'

type Position = {
  id: string; ticker: string; market: 'stock' | 'crypto'
  quantity: number; entry_price: number; created_at: string
}

function formatPrice(p: number) {
  if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (p >= 1) return `$${p.toFixed(2)}`
  if (p >= 0.01) return `$${p.toFixed(4)}`
  // Sub-cent coins (SHIB, etc.) need significant digits, not fixed decimals
  return p > 0 ? `$${p.toPrecision(3)}` : '$0'
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
            Position values update with each analysis refresh. Informational only — not financial advice.
          </p>
        </div>
      )}
    </div>
  )
}

// ── What changed ──────────────────────────────────────────
// The stance a coin carries matters less than the fact it just moved. On
// a day where 45 of 46 assets read NEUTRAL, this is the only part of the
// board that varies — so it goes first.
const STANCE: Record<string, { label: string; color: string }> = {
  buy:   { label: 'BULLISH', color: 'var(--accent)' },
  sell:  { label: 'BEARISH', color: 'var(--red)' },
  watch: { label: 'NEUTRAL', color: '#f0b23c' },
}

type SignalChange = {
  ticker: string; signal_type: string; previous_type: string
  price_at_change: number; current_price: number | null
  change_pct: number | null; generated_at: string
}

function WhatChangedSection() {
  const [changes, setChanges] = useState<SignalChange[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/signal-changes')
      .then(r => (r.ok ? r.json() : { changes: [] }))
      .then(d => { setChanges(d.changes ?? []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded) return null

  return (
    <div className="mb-6 rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>What changed</h2>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>last 24 hours</span>
      </div>

      {changes.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          No stance changes in the last 24 hours — the board is holding steady. That&apos;s
          normal on quiet days, and usually more common than not.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {changes.map(c => {
            const from = STANCE[c.previous_type] ?? STANCE.watch
            const to = STANCE[c.signal_type] ?? STANCE.watch
            return (
              <div key={c.ticker} className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-semibold" style={{ color: 'var(--text-primary)', minWidth: 54 }}>
                  {c.ticker}
                </span>
                <span style={{ color: from.color, opacity: 0.65 }}>{from.label}</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span className="font-semibold" style={{ color: to.color }}>{to.label}</span>
                {c.change_pct != null && (
                  <span className="ml-auto" style={{ color: c.change_pct >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                    {c.change_pct >= 0 ? '+' : ''}{c.change_pct.toFixed(1)}% since
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Coin requests ─────────────────────────────────────────
// Paying subscribers nominate up to 3 coins to add next. Trial users see
// the panel in a locked state — it's one of the few concrete reasons to
// convert, so it's worth showing rather than hiding.
function CoinRequestsSection() {
  const [requests, setRequests] = useState<{ id: string; coin: string }[]>([])
  const [eligible, setEligible] = useState(false)
  const [limit, setLimit] = useState(3)
  const [loaded, setLoaded] = useState(false)
  const [coin, setCoin] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/coin-requests')
      .then(r => r.json())
      .then(d => {
        setRequests(d.requests ?? [])
        setEligible(!!d.eligible)
        if (d.limit) setLimit(d.limit)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  async function addCoin(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const value = coin.trim()
    if (!value) { setFormError('Enter a coin name or ticker'); return }
    setSaving(true)
    const res = await fetch('/api/coin-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coin: value }),
    })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) { setFormError(d.error ?? 'Could not save request'); return }
    setRequests(r => [...r, d.request])
    setCoin('')
  }

  async function removeCoin(id: string) {
    setRequests(r => r.filter(x => x.id !== id))
    await fetch(`/api/coin-requests?id=${id}`, { method: 'DELETE' }).catch(() => {})
  }

  if (!loaded) return null
  const remaining = limit - requests.length

  return (
    <div className="mb-6 rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Request a coin
          </h2>
          {eligible && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {requests.length} of {limit} used
            </span>
          )}
        </div>
      </div>

      {!eligible ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Requesting coins is a subscriber perk — it unlocks once your trial converts to a paid plan.
          The most-requested coins get added first.
        </p>
      ) : (
        <>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            Pick up to {limit} coins you&apos;d like analyzed. Every subscriber gets a say, and the
            most-requested ones get added first.
          </p>

          {requests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {requests.map(r => (
                <span key={r.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {r.coin}
                  <button onClick={() => removeCoin(r.id)} title={`Remove ${r.coin}`}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          {remaining > 0 ? (
            <form onSubmit={addCoin} className="flex gap-2 flex-wrap items-center">
              <input value={coin} onChange={e => setCoin(e.target.value)} maxLength={40}
                placeholder="e.g. Hyperliquid or HYPE"
                className="px-3 py-1.5 rounded-lg text-xs flex-1 min-w-[180px]"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              <button type="submit" disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--accent-dim)', border: 'none', color: 'var(--accent)', cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Adding…' : `+ Add (${remaining} left)`}
              </button>
            </form>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              You&apos;ve used all {limit} requests. Remove one to swap it out.
            </p>
          )}

          {formError && (
            <p className="text-xs mt-2" style={{ color: 'var(--red)' }}>{formError}</p>
          )}
        </>
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
  // When the analysis itself was generated — not when the browser last
  // fetched it. The page refetches every 15 minutes but signals only
  // regenerate every 2 hours, so showing the fetch time would overstate
  // how fresh the numbers are.
  const [analysisRunAt, setAnalysisRunAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  // The onboarding answers, used to rank and tag the shared analysis.
  const [profile, setProfile] = useState<TraderProfile | null>(null)
  const [sort, setSort] = useState<SortKey>('zone')
  const [sortTouched, setSortTouched] = useState(false)

  const fetchSignals = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/signals')
      if (res.status === 401) { router.push('/auth'); return }
      // Signed in but no active subscription — send them to finish checkout
      if (res.status === 403) { router.push('/subscribe'); return }
      if (!res.ok) throw new Error('Failed to fetch analysis')
      const data = await res.json()
      const rows: Signal[] = data.signals ?? []
      setSignals(rows)
      const newest = rows.reduce<string | null>(
        (max, s) => (s.generated_at && (!max || s.generated_at > max) ? s.generated_at : max),
        null,
      )
      setAnalysisRunAt(newest ? new Date(newest) : null)
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

  // Load the onboarding profile once, and open the board on the view that
  // suits their horizon — unless they've already chosen a sort themselves.
  useEffect(() => {
    fetch('/api/profile')
      .then(r => (r.ok ? r.json() : { profile: null }))
      .then(d => {
        const p: TraderProfile | null = d.profile ?? null
        setProfile(p)
        if (p) setSort(prev => (sortTouched ? prev : defaultSortFor(p)))
      })
      .catch(() => {})
    // sortTouched intentionally omitted: this should run once, and reading
    // it through the setter callback keeps a later manual choice safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const fitByTicker = new Map(signals.map(s => [s.ticker, fitsProfile(s, profile)]))
  const fitCount = Array.from(fitByTicker.values()).filter(f => f.fits).length

  const filtered = sortSignals(
    signals.filter(s => {
      if (filter === 'all') return true
      return s.signal_type === filter
    }),
    sort,
    profile,
  )

  const buys = signals.filter(s => s.signal_type === 'buy').length
  const sells = signals.filter(s => s.signal_type === 'sell').length
  const avgConf = signals.length ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length) : 0

  // Market breadth, stated honestly.
  //
  // This used to be `buys > sells`, which had two ways of lying. With an
  // empty board (0 vs 0) it fell through to "Bearish" in alarm red while
  // signals were still loading. And it ignored NEUTRAL entirely, so a
  // typical day of 1 bullish / 0 bearish / 45 neutral was announced as
  // "Bullish" off a single asset out of 46.
  const neutrals = signals.length - buys - sells
  const breadth = (() => {
    if (signals.length === 0) {
      return { label: '—', sub: 'waiting for analysis', color: 'var(--text-muted)' }
    }
    // When most of the board has no direction, that IS the finding.
    if (neutrals / signals.length >= 0.8) {
      return {
        label: 'Mixed',
        sub: `${neutrals} of ${signals.length} neutral`,
        color: 'var(--amber)',
      }
    }
    const sub = `${buys} bullish vs ${sells} bearish`
    if (buys > sells) return { label: 'Bullish', sub, color: 'var(--accent)' }
    if (sells > buys) return { label: 'Bearish', sub, color: 'var(--red)' }
    return { label: 'Even', sub, color: 'var(--amber)' }
  })()

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
          {analysisRunAt && (
            <span className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>
              Analysis from {analysisRunAt.toLocaleTimeString()}
            </span>
          )}
          <Link href="/track-record" title="See our past calls and how they played out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <History size={12} />
            <span className="hidden md:inline">Track record</span>
          </Link>
          <Link href="/practice" title="Practice with $10,000 of imaginary money"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <Wallet size={12} />
            <span className="hidden md:inline">Practice</span>
          </Link>
          <Link href="/learn" title="Learn the basics"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <BookOpen size={12} />
            <span className="hidden md:inline">Learn</span>
          </Link>
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
            AI technical analysis across the top cryptocurrencies — for educational purposes
          </p>
        </div>

        {/* Stats row — factual metrics only */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Bullish setups" value={signals.length ? String(buys) : '—'}
            sub={signals.length ? `${signals.length} assets analyzed` : 'waiting for analysis'}
            color="var(--accent)" />
          <StatCard label="Bearish setups" value={signals.length ? String(sells) : '—'}
            sub="Distribution patterns" color="var(--red)" />
          <StatCard label="Avg confidence" value={signals.length ? `${avgConf}%` : '—'}
            sub="Across current analysis" />
          <StatCard label="Market breadth" value={breadth.label} sub={breadth.sub} color={breadth.color} />
        </div>

        {/* What changed in the last 24h */}
        <WhatChangedSection />

        {/* Buy-in zone alerts */}
        <PushToggle />

        {/* My Positions */}
        <PositionsSection signals={signals} />

        {/* Request a coin */}
        <CoinRequestsSection />

        {/* Today's biggest movers */}
        {(() => {
          const movers = signals
            .filter(s => s.percent_change_24h != null)
            .sort((a, b) => Math.abs(b.percent_change_24h!) - Math.abs(a.percent_change_24h!))
            .slice(0, 5)
          if (movers.length < 3) return null
          return (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                Biggest movers today:
              </span>
              {movers.map(s => (
                <button key={s.ticker} type="button"
                  onClick={() => { setFilter('all'); setSelectedSignal(s) }}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: (s.percent_change_24h ?? 0) >= 0 ? 'var(--accent-dim)' : 'var(--red-dim)',
                    color: (s.percent_change_24h ?? 0) >= 0 ? 'var(--accent)' : 'var(--red)',
                    border: 'none', cursor: 'pointer',
                  }}>
                  {s.ticker} {(s.percent_change_24h ?? 0) >= 0 ? '+' : ''}{s.percent_change_24h!.toFixed(1)}%
                </button>
              ))}
            </div>
          )
        })()}

        {/* Filter pills + ordering. On a day when nearly every asset reads
            NEUTRAL, stance tells the reader nothing — what varies is how
            close each one sits to the level it's been telling them to watch. */}
        <div className="flex gap-2 mb-5 flex-wrap items-center">
          {([
            { key: 'all', label: 'All' },
            { key: 'buy', label: 'Bullish' },
            { key: 'sell', label: 'Bearish' },
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

          <select value={sort} onChange={e => { setSort(e.target.value as SortKey); setSortTouched(true) }}
            title="Order the board"
            className="ml-auto px-3 py-1.5 rounded-full text-xs"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
              <option key={k} value={k}>{SORT_LABELS[k]}</option>
            ))}
          </select>
        </div>

        {profile && sort === 'profile' && (
          <div className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Ordered by how closely each setup matches your{' '}
            <Link href="/onboarding" style={{ color: 'var(--accent)' }}>trading profile</Link>
            {fitCount > 0
              ? <> — {fitCount} {fitCount === 1 ? 'setup fits' : 'setups fit'} it exactly today.</>
              : <> — nothing fits it exactly today, so the closest are first.</>}
          </div>
        )}

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
                      <Bitcoin size={14} color="var(--text-muted)" />
                      <span className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                        {signal.ticker}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {ASSET_NAMES[signal.ticker] ?? 'Cryptocurrency'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {fitByTicker.get(signal.ticker)?.fits && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded"
                        title={fitByTicker.get(signal.ticker)!.reasons.join(' · ')}
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                        FITS YOU
                      </span>
                    )}
                    <SignalBadge type={signal.signal_type} />
                  </div>
                </div>

                {/* The card has always named a zone to watch; this says how
                    far away it currently is, which is the bit that moves. */}
                {(() => {
                  const d = zoneDistancePct(signal)
                  if (d == null) return null
                  return (
                    <div className="text-xs mb-2"
                      style={{ color: d === 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {d === 0
                        ? '● In its buy-in zone now'
                        : `${d.toFixed(1)}% from its buy-in zone`}
                    </div>
                  )
                })()}

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatPrice(signal.price)}
                  </span>
                  {signal.percent_change_24h != null && (
                    <span className="text-xs font-semibold"
                      style={{ color: signal.percent_change_24h >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                      {signal.percent_change_24h >= 0 ? '+' : ''}{signal.percent_change_24h.toFixed(2)}% today
                    </span>
                  )}
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
                    {signal.simple_reasoning && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          What this means
                        </div>
                        <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {signal.simple_reasoning}
                        </div>
                      </div>
                    )}

                    {signal.chart_closes && signal.chart_closes.length >= 5 && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          Recent price vs the key levels
                        </div>
                        <SignalChart
                          closes={signal.chart_closes}
                          entryLow={signal.entry_low}
                          entryHigh={signal.entry_high}
                          target={signal.target_price}
                          stop={signal.stop_loss}
                        />
                      </div>
                    )}

                    <div className="mb-4">
                      {signal.simple_reasoning && (
                        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          Technical detail <span className="font-normal" style={{ color: 'var(--text-muted)' }}>— tap any underlined term for a plain-English meaning</span>
                        </div>
                      )}
                      <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        <GlossaryText text={signal.ai_reasoning} />
                      </div>
                    </div>

                    {/* Plain-English setup line: what to actually do with the levels.
                        When the analysis returns no levels at all, say so rather than
                        rendering nothing — a silent gap reads as broken data. */}
                    {!(signal.entry_low && signal.entry_high && signal.stop_loss) && (
                      <div className="text-xs leading-relaxed p-2.5 rounded-lg mb-3"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>The setup: </span>
                        this one has no clearly defined levels right now — the technicals haven&apos;t
                        marked out a zone worth watching. The read above still applies.
                      </div>
                    )}
                    {signal.entry_low && signal.entry_high && signal.stop_loss && (
                      <div className="text-xs leading-relaxed p-2.5 rounded-lg mb-3"
                        style={{ background: 'var(--accent-dim)', border: '1px solid rgba(0,229,160,0.2)', color: 'var(--text-secondary)' }}>
                        <span className="font-semibold" style={{ color: 'var(--accent)' }}>The setup: </span>
                        {signal.signal_type === 'buy' && (
                          <>the analysis sees {formatPrice(signal.entry_low)}–{formatPrice(signal.entry_high)} as
                          the zone to consider buying in{signal.target_price ? <>, aiming toward {formatPrice(signal.target_price)}</> : null}
                          {' '}— and getting out if the price falls below {formatPrice(signal.stop_loss)}.</>
                        )}
                        {signal.signal_type === 'watch' && (
                          <>nothing to act on yet — but if you&apos;re waiting to get in,
                          {' '}{formatPrice(signal.entry_low)}–{formatPrice(signal.entry_high)} is the buy-in zone to watch.
                          {signal.target_price ? <> A push above {formatPrice(signal.target_price)} would strengthen the case;</> : null}
                          {' '}a drop below {formatPrice(signal.stop_loss)} would weaken it.</>
                        )}
                        {signal.signal_type === 'sell' && (
                          <>the technicals lean negative — holders often treat a drop below {formatPrice(signal.stop_loss)} as
                          the get-out signal, while {formatPrice(signal.entry_low)}–{formatPrice(signal.entry_high)} is where
                          buyers may step back in.</>
                        )}
                        <span style={{ color: 'var(--text-muted)' }}> Educational scenario, not a recommendation.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {signal.entry_low && signal.entry_high && (
                        <div className="p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                          <div style={{ color: 'var(--text-muted)' }}>Buy-in zone to watch</div>
                          <div className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                            {formatPrice(signal.entry_low)} – {formatPrice(signal.entry_high)}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>near support</div>
                        </div>
                      )}
                      {signal.target_price && (
                        <div className="p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                          <div style={{ color: 'var(--text-muted)' }}>Price target</div>
                          <div className="font-medium mt-0.5" style={{ color: 'var(--accent)' }}>
                            {formatPrice(signal.target_price)}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>next resistance</div>
                        </div>
                      )}
                      {signal.stop_loss && (
                        <div className="p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                          <div style={{ color: 'var(--text-muted)' }}>Get-out level</div>
                          <div className="font-medium mt-0.5" style={{ color: 'var(--red)' }}>
                            {formatPrice(signal.stop_loss)}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>setup fails below this</div>
                        </div>
                      )}
                      {signal.ath_change_pct != null && signal.ath_change_pct < -1 && (
                        <div className="p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                          <div style={{ color: 'var(--text-muted)' }}>vs all-time high</div>
                          <div className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                            {Math.abs(signal.ath_change_pct).toFixed(0)}% below record
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                            record high {formatPrice(signal.ath_price ?? signal.price / (1 + signal.ath_change_pct / 100))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Updated {new Date(signal.generated_at).toLocaleTimeString()} · Educational analysis, not advice
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
          <Link href="/track-record" style={{ color: 'var(--accent)' }}>Track record</Link>
          {' · '}
          <Link href="/learn" style={{ color: 'var(--accent)' }}>Learn</Link>
          {' · '}
          <Link href="/terms" style={{ color: 'var(--accent)' }}>Terms</Link>
          {' · '}
          <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy</Link>
          {' · '}
          <Link href="/disclaimer" style={{ color: 'var(--accent)' }}>Full disclaimer</Link>
          {' · '}
          <a href="mailto:support@alphaedge.network" style={{ color: 'var(--accent)' }}>Support</a>
          <div className="mt-2" style={{ color: 'var(--text-muted)' }}>
            Data provided by{' '}
            <a href="https://www.coingecko.com/en/api" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)' }}>CoinGecko</a>
          </div>
        </div>
      </div>
    </div>
  )
}
