'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, History } from 'lucide-react'
import { ASSET_NAMES } from '@/lib/assets'

// Public page: every time the AI's stance on an asset changes, it is
// recorded permanently with a timestamp and the price at that moment.
// Visitors can judge the calls for themselves — transparency as marketing.

type HistoryRow = {
  ticker: string; market: 'stock' | 'crypto'
  signal_type: 'buy' | 'sell' | 'watch'
  previous_type: 'buy' | 'sell' | 'watch' | null
  confidence: number | null
  price: number
  current_price: number | null
  generated_at: string
}

const LABELS: Record<string, { text: string; color: string }> = {
  buy: { text: 'BULLISH', color: 'var(--accent)' },
  sell: { text: 'BEARISH', color: 'var(--red)' },
  watch: { text: 'NEUTRAL', color: 'var(--amber)' },
}

function formatPrice(p: number) {
  if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (p >= 1) return `$${p.toFixed(2)}`
  if (p >= 0.01) return `$${p.toFixed(4)}`
  return p > 0 ? `$${p.toPrecision(3)}` : '$0'
}

// Honest per-call grading:
// - NEUTRAL calls predict no direction, so they are never graded
// - calls under 24h old are "too early" — no verdict until the market has
//   had a real chance to move
// - moves inside ±1% are "flat", counted as neither hit nor miss
type Verdict = 'hit' | 'miss' | 'flat' | 'early' | null

function gradeCall(r: HistoryRow): { verdict: Verdict; move: number | null } {
  const move = r.current_price != null && r.price > 0
    ? ((r.current_price / r.price) - 1) * 100
    : null
  if (r.signal_type === 'watch' || move == null) return { verdict: null, move }
  const ageHours = (Date.now() - new Date(r.generated_at).getTime()) / 3_600_000
  if (ageHours < 24) return { verdict: 'early', move }
  if (Math.abs(move) < 1) return { verdict: 'flat', move }
  const favorable = r.signal_type === 'buy' ? move > 0 : move < 0
  return { verdict: favorable ? 'hit' : 'miss', move }
}

const VERDICT_CHIP: Record<Exclude<Verdict, null>, { text: string; color: string; bg: string }> = {
  hit: { text: '✓ On target', color: 'var(--accent)', bg: 'var(--accent-dim)' },
  miss: { text: '✗ Off the mark', color: 'var(--red)', bg: 'var(--red-dim)' },
  flat: { text: '≈ Flat so far', color: 'var(--amber)', bg: 'var(--amber-dim)' },
  early: { text: 'Too early to grade', color: 'var(--text-muted)', bg: 'var(--bg-card)' },
}

export default function TrackRecordPage() {
  const [rows, setRows] = useState<HistoryRow[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/track-record')
      .then(r => r.json())
      .then(d => setRows(d.history ?? []))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <nav className="flex items-center justify-between px-6 py-3"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <TrendingUp size={14} color="var(--accent)" />
          </span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>AlphaEdge</span>
        </Link>
        <Link href="/auth" className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--accent)', color: '#0a0d12', textDecoration: 'none' }}>
          Start free trial
        </Link>
      </nav>

      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <History size={22} style={{ color: 'var(--accent)' }} /> Track record
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Every time our AI changes its stance on an asset, the call is recorded here permanently —
            with the exact time and price. Judge the calls for yourself. Prices shown update with
            each analysis refresh.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl text-sm" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
            Could not load the track record — try refreshing the page.
          </div>
        )}

        {rows === null && !error && (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="rounded-xl animate-pulse" style={{ background: 'var(--bg-secondary)', height: 72 }} />
            ))}
          </div>
        )}

        {rows !== null && rows.length === 0 && (
          <div className="p-6 rounded-xl text-sm text-center" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            Recording just started — signal changes will appear here as the market moves.
          </div>
        )}

        {rows !== null && rows.length > 0 && (() => {
          const graded = rows.map(r => gradeCall(r))
          const hits = graded.filter(g => g.verdict === 'hit').length
          const misses = graded.filter(g => g.verdict === 'miss').length
          const scored = hits + misses
          return (
          <>
          {scored >= 5 && (
            <div className="mb-4 p-4 rounded-xl flex items-center gap-4 flex-wrap"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  {Math.round((hits / scored) * 100)}%
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>moved in our favor</div>
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '32rem' }}>
                Of {scored} graded directional calls (bullish or bearish, at least 24 hours old,
                excluding moves under ±1%), {hits} moved the way the analysis suggested.
                Neutral stances make no direction call, so they are never graded.
              </div>
            </div>
          )}
          <div className="space-y-2">
            {rows.map((r, i) => {
              const now = LABELS[r.signal_type] ?? LABELS.watch
              const was = r.previous_type ? (LABELS[r.previous_type] ?? LABELS.watch) : null
              const { verdict, move } = graded[i]
              return (
                <div key={i} className="p-4 rounded-xl flex items-center justify-between gap-3 flex-wrap"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.ticker}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {ASSET_NAMES[r.ticker] ?? 'Crypto'}
                      </span>
                      {was && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span style={{ color: was.color }}>{was.text}</span>
                          {' → '}
                        </span>
                      )}
                      <span className="text-xs font-bold" style={{ color: now.color }}>{now.text}</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(r.generated_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}{' '}
                      at {formatPrice(r.price)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {move != null && Math.abs(move) >= 0.05 && (
                      <div className="text-right">
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>price since</div>
                        <div className="text-sm font-bold" style={{ color: move >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                          {move >= 0 ? '+' : ''}{move.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {verdict && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap"
                        style={{ color: VERDICT_CHIP[verdict].color, background: VERDICT_CHIP[verdict].bg }}>
                        {VERDICT_CHIP[verdict].text}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          </>
          )
        })()}

        <div className="mt-8 p-4 rounded-xl text-xs" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Signal changes are recorded automatically and cannot be edited or deleted. AlphaEdge
          analysis is educational information, not financial advice — past signals are not a promise
          of future results.{' '}
          <Link href="/disclaimer" style={{ color: 'var(--accent)' }}>Full disclaimer</Link>
          <div className="mt-2">
            Data provided by{' '}
            <a href="https://www.coingecko.com/en/api" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)' }}>CoinGecko</a>
          </div>
        </div>
      </div>
    </div>
  )
}
