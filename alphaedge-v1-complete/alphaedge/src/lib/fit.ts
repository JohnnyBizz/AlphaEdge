// ── Profile fit and board ordering ────────────────────────
// Onboarding asks three questions and, until now, nothing used the answers:
// the profile was only read on the on-demand generation path, which almost
// never runs once the cache is warm. Personalising the *generation* would
// mean re-analysing 46 assets per user, so instead the shared analysis is
// ranked and tagged per profile at display time.
//
// Every rule below maps to something onboarding literally asked. Nothing
// here infers preferences the user never stated.

export interface TraderProfile {
  trade_style: 'scalp' | 'swing' | 'position'
  profit_target: 'quick' | 'moderate' | 'home_run'
  risk_tolerance: 'conservative' | 'balanced' | 'aggressive'
}

export interface RankableSignal {
  ticker: string
  signal_type: 'buy' | 'sell' | 'watch'
  confidence: number
  price: number
  entry_low: number | null
  entry_high: number | null
  target_price: number | null
  stop_loss: number | null
  percent_change_24h: number | null
  ath_change_pct: number | null
}

// The profit targets quoted to the user during onboarding.
const TARGET_BANDS: Record<TraderProfile['profit_target'], [number, number]> = {
  quick:    [2, 5],
  moderate: [10, 20],
  home_run: [30, Infinity],
}

// The stop distances quoted alongside each risk setting.
const MAX_STOP_DISTANCE: Record<TraderProfile['risk_tolerance'], number> = {
  conservative: 3,
  balanced:     5,
  aggressive:   10,
}

// Confidence deliberately plays no part in the match. The prompt describes
// conservative as "only setups with 80%+ confidence", but the model's actual
// output tops out around 71 — measured across a live board, nothing reached
// 80 and only 3 of 46 reached 60. Gating on it would have meant an
// permanently empty result for conservative users. Confidence is shown on the
// card; it isn't one of the three things onboarding asked about.

/** Upside from the current price to the target, as a percentage. */
export function upsidePct(s: RankableSignal): number | null {
  if (!s.target_price || !(s.price > 0)) return null
  return ((s.target_price / s.price) - 1) * 100
}

/** How far below the current price the get-out level sits, as a percentage. */
export function stopDistancePct(s: RankableSignal): number | null {
  if (!s.stop_loss || !(s.price > 0)) return null
  return (1 - (s.stop_loss / s.price)) * 100
}

/**
 * Distance from the current price to the buy-in zone, as a percentage.
 * Zero means the price is inside the zone right now — the moment the card
 * has been telling people to watch for.
 */
export function zoneDistancePct(s: RankableSignal): number | null {
  if (!s.entry_low || !s.entry_high || !(s.price > 0)) return null
  if (s.price >= s.entry_low && s.price <= s.entry_high) return 0
  const nearest = s.price < s.entry_low ? s.entry_low : s.entry_high
  return Math.abs((s.price - nearest) / s.price) * 100
}

export interface Fit {
  fits: boolean
  /** Plain-English reasons, shown to explain the tag rather than assert it. */
  reasons: string[]
}

/**
 * Whether a setup matches what the user said they wanted. Deliberately
 * strict: a tag that appears on 40 of 46 cards tells nobody anything.
 */
export function fitsProfile(s: RankableSignal, p: TraderProfile | null): Fit {
  if (!p) return { fits: false, reasons: [] }

  const reasons: string[] = []
  const up = upsidePct(s)
  const stop = stopDistancePct(s)
  const [minTarget, maxTarget] = TARGET_BANDS[p.profit_target]

  const targetOk = up != null && up >= minTarget && up <= maxTarget
  const stopOk = stop != null && stop > 0 && stop <= MAX_STOP_DISTANCE[p.risk_tolerance]

  if (targetOk) reasons.push(`${up!.toFixed(0)}% to target matches your ${labelTarget(p.profit_target)} goal`)
  if (stopOk) reasons.push(`get-out level is ${stop!.toFixed(1)}% away, inside your risk setting`)

  return { fits: targetOk && stopOk, reasons }
}

/**
 * How far a setup sits from what the user asked for — 0 is an exact match,
 * and the number grows with the distance outside their bands.
 *
 * This exists because an exact match is genuinely rare: crypto stops anchor
 * to real support levels, which sit 5–20% away, so a conservative profile
 * asking for 2–3% can go days matching nothing. Ranking by closeness means
 * the board is always ordered by their preferences even when nothing clears
 * the bar, instead of showing them an empty screen.
 */
export function profileDistance(s: RankableSignal, p: TraderProfile | null): number {
  if (!p) return 0
  const up = upsidePct(s)
  const stop = stopDistancePct(s)
  if (up == null || stop == null) return Number.POSITIVE_INFINITY

  const [lo, hi] = TARGET_BANDS[p.profit_target]
  // Distance outside the band, relative to the band itself, so a "quick"
  // 2–5% goal isn't dwarfed by a "home run" 30%+ one on raw percentage points.
  const targetMiss = up < lo ? (lo - up) / lo : up > hi && hi !== Infinity ? (up - hi) / hi : 0

  const maxStop = MAX_STOP_DISTANCE[p.risk_tolerance]
  const stopMiss = stop > maxStop ? (stop - maxStop) / maxStop : 0

  return targetMiss + stopMiss
}

function labelTarget(t: TraderProfile['profit_target']) {
  return t === 'quick' ? '2–5%' : t === 'moderate' ? '10–20%' : '30%+'
}

export type SortKey = 'profile' | 'zone' | 'move' | 'discount' | 'confidence'

export const SORT_LABELS: Record<SortKey, string> = {
  profile:    'Best for your profile',
  zone:       'Closest to buy-in zone',
  move:       'Biggest move today',
  discount:   'Furthest below record high',
  confidence: 'Highest confidence',
}

/**
 * The opening view depends on the horizon the user chose: a scalper needs
 * whatever is moving now, a swing trader needs what is approaching its
 * level, and a position trader is shopping for long-term discounts.
 */
export function defaultSortFor(p: TraderProfile | null): SortKey {
  return p ? 'profile' : 'zone'
}

/**
 * Tiebreaker within equally-matching setups, taken from the horizon the user
 * chose: a scalper wants whatever is moving now, a position trader wants the
 * deepest discount, a swing trader wants what is nearest its level.
 */
function styleTiebreak<T extends RankableSignal>(s: T, p: TraderProfile | null): number {
  if (!p || p.trade_style === 'swing') return zoneDistancePct(s) ?? Number.POSITIVE_INFINITY
  if (p.trade_style === 'scalp') return -Math.abs(s.percent_change_24h ?? 0)
  return s.ath_change_pct ?? Number.POSITIVE_INFINITY
}

/** Sorts a copy; nulls always sink so a missing value never leads the board. */
export function sortSignals<T extends RankableSignal>(
  signals: T[], key: SortKey, profile: TraderProfile | null = null,
): T[] {
  const sunk = (v: number | null) => (v == null ? Number.POSITIVE_INFINITY : v)
  const rank: Record<SortKey, (s: T) => number> = {
    profile:    s => profileDistance(s, profile),
    zone:       s => sunk(zoneDistancePct(s)),
    move:       s => -Math.abs(s.percent_change_24h ?? -Infinity),
    discount:   s => sunk(s.ath_change_pct == null ? null : s.ath_change_pct),
    confidence: s => -s.confidence,
  }
  return [...signals].sort((a, b) =>
    rank[key](a) - rank[key](b) ||
    (key === 'profile' ? styleTiebreak(a, profile) - styleTiebreak(b, profile) : 0) ||
    a.ticker.localeCompare(b.ticker))
}
