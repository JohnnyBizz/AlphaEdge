'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, RefreshCw, LogOut, BarChart2, Bitcoin, Building2, Eye, Settings,
} from 'lucide-react'

type Signal = {
  id: string; ticker: string; market: 'stock' | 'crypto'
  signal_type: 'buy' | 'sell' | 'watch'; confidence: number; price: number
  entry_low: number | null; entry_high: number | null; target_price: number | null
  stop_loss: number | null; rsi: number | null; macd_signal: string | null
  volume_ratio: number | null; ai_reasoning: string; generated_at: string
}

type Filter = 'all' | 'stock' | 'crypto' | 'buy' | 'sell'

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
