import Anthropic from '@anthropic-ai/sdk'
import { MarketSnapshot } from './market-data'
import { createAdminClient } from './supabase/admin'
import { sendSignalChangeAlerts } from './alerts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Types ─────────────────────────────────────────────────

export interface TraderProfile {
  trade_style:    'scalp' | 'swing' | 'position'
  profit_target:  'quick' | 'moderate' | 'home_run'
  risk_tolerance: 'conservative' | 'balanced' | 'aggressive'
}

export interface GeneratedSignal {
  ticker: string
  market: 'stock' | 'crypto'
  signal_type: 'buy' | 'sell' | 'watch'
  confidence: number
  price: number
  entry_low: number | null
  entry_high: number | null
  target_price: number | null
  stop_loss: number | null
  rsi: number | null
  macd_signal: string | null
  volume_ratio: number | null
  ai_reasoning: string
  simple_reasoning: string
  chart_closes: { t: number; c: number; m?: number }[]
  percent_change_24h: number | null
  ath_change_pct: number | null
  ath_price: number | null
}

// ── Trader profile → prompt description ──────────────────

function describeProfile(p: TraderProfile): string {
  const styleMap = {
    scalp:    'a scalp trader who holds positions for minutes to hours and needs fast, high-probability setups',
    swing:    'a swing trader who holds positions for days to weeks and balances speed with patience',
    position: 'a position trader who holds for weeks to months and focuses on macro trends',
  }
  const targetMap = {
    quick:    '2–5% profit targets per trade (quick, frequent wins)',
    moderate: '10–20% profit targets per trade (solid upside with manageable risk)',
    home_run: '30%+ profit targets per trade (explosive moves, willing to wait for the right setup)',
  }
  // Stop ranges match what crypto actually offers: levels anchor to real
  // support, which across a live board sat 3–22% away with a median of 8%.
  // The old 2–3% / 4–5% / 6–10% tiers described equities, not this market.
  const riskMap = {
    conservative: 'conservative risk management: tighter stop losses within ~6%, only the cleanest setups',
    balanced:     'balanced risk management: standard stop losses within ~10%, mix of safe and opportunistic analysis',
    aggressive:   'aggressive risk management: wider stop losses up to ~20%, higher-risk/higher-reward setups acceptable',
  }
  return `
TRADER PROFILE:
- Trading style: ${styleMap[p.trade_style]}
- Profit target: ${targetMap[p.profit_target]}
- Risk approach: ${riskMap[p.risk_tolerance]}

Adapt your analysis to this profile:
${p.trade_style === 'scalp'    ? '- Favor intraday momentum, RSI reversals, and volume spikes. Use 1H/4H timeframe language.' : ''}
${p.trade_style === 'swing'    ? '- Favor daily chart setups, MACD crossovers, and multi-day breakouts.' : ''}
${p.trade_style === 'position' ? '- Favor weekly trends and macro support levels.' : ''}
${p.profit_target === 'quick'    ? '- Set conservative targets close to current price. Only flag high-confidence (80%+) setups.' : ''}
${p.profit_target === 'home_run' ? '- Set ambitious targets using Fibonacci extensions. 60%+ confidence acceptable.' : ''}
${p.risk_tolerance === 'conservative' ? '- Only flag BUY analysis with 3+ confirming indicators. Prefer a stop within ~6% of entry, anchored to real support.' : ''}
${p.risk_tolerance === 'aggressive'   ? '- Accept more risk for bigger upside. Stop can sit up to ~20% below entry.' : ''}
  `.trim()
}

// ── System prompt ─────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are a professional quantitative analyst with 20+ years of experience producing educational technical analysis.

You analyze market data including technical indicators (RSI, MACD, Bollinger Bands, VWAP, volume) to generate structured educational analysis. Your output describes what the technicals suggest — it is informational analysis, not personalized financial advice.

For each asset, return a JSON object with this exact structure:
{
  "signal_type": "buy" | "sell" | "watch",
  "confidence": <integer 0-100>,
  "entry_low": <number, required>,
  "entry_high": <number, required>,
  "target_price": <number, required — the next resistance level above the current price>,
  "stop_loss": <number, required>,
  "macd_signal": "bullish_crossover" | "bearish_crossover" | "bullish" | "bearish" | "neutral",
  "ai_reasoning": "<2-3 sentence analysis explaining what the indicators suggest and what to watch for>",
  "simple_summary": "<2 short sentences in plain everyday English for someone with zero trading knowledge. No jargon — never use terms like RSI, MACD, SMA, Bollinger, VWAP, histogram, or crossover. Explain what the price is doing and what the stance means in words like: the price has been climbing/falling/moving sideways, it looks expensive/cheap right now, it may be worth waiting for a dip, momentum is building/fading.>"
}

Signal generation guidelines:
- BUY: RSI 30–60 with upward momentum, MACD bullish crossover, price above 20-day SMA, volume confirmation
- SELL: RSI above 70 (overbought), MACD bearish crossover, price at resistance, declining volume
- WATCH: Mixed signals, consolidation, or insufficient confirmation
- Confidence 80–100: multiple confirming indicators; 60–79: 2–3 aligned; below 60: always WATCH
- Entry zones within 1–2% of current price; never generate BUY above 80 confidence without volume confirmation
- All four price levels are ALWAYS required, including for SELL and WATCH. Never
  return null for any of them because a setup looks unattractive — they are reference
  levels describing the chart, not a recommendation to trade:
    · entry_low/entry_high — the zone worth watching, anchored to nearby support or
      the lower Bollinger band
    · target_price — the next resistance level above the current price
    · stop_loss — the level that would invalidate the setup
  A deeply oversold, bearish or beaten-down asset still has all four.

Return ONLY valid JSON, no markdown, no text outside the JSON.`

// ── Signal generation ─────────────────────────────────────

// ── Stance stickiness ─────────────────────────────────────
// Each run re-analyses from scratch, so an asset sitting near a decision
// boundary would flip on sampling noise alone — UNI went BUY → WATCH →
// BUY across three runs at an identical $3.66, and ETH round-tripped in
// 16 minutes on a 0.03% move. A stance change is presented to users as a
// meaningful event (it drives the alert emails), so it needs a dead band:
// enter a directional stance at high confidence, leave it only once
// conviction has genuinely gone, and hold in between.
const ENTER_DIRECTIONAL = 68
const EXIT_DIRECTIONAL = 55

function stanceSection(previous: string | undefined): string {
  if (!previous) return ''
  const label = previous === 'buy' ? 'BUY' : previous === 'sell' ? 'SELL' : 'WATCH'
  return `

CURRENT STANCE: this asset is currently ${label}.
Stance stability matters — users are notified when it changes, so a change must
mean something. Apply these rules:
- Keep the current stance unless the technicals clearly justify a change.
- Never change stance on a marginal confidence difference, or when the indicator
  values are essentially unchanged from the levels described above.
- To move WATCH → BUY or WATCH → SELL you need at least ${ENTER_DIRECTIONAL} confidence.
- To leave BUY or SELL back to WATCH, conviction must have genuinely deteriorated
  (below ${EXIT_DIRECTIONAL}) — not merely softened.
- If you are between those thresholds, keep ${label} and say what you're waiting for.`
}

export async function generateSignalForAsset(
  snapshot: MarketSnapshot,
  traderProfile: TraderProfile | null = null,
  previousStance?: string
): Promise<GeneratedSignal> {
  const volumeRatio = snapshot.volumeAvg20d > 0
    ? parseFloat((snapshot.volume24h / snapshot.volumeAvg20d).toFixed(2))
    : null

  const profileSection = traderProfile ? `\n\n${describeProfile(traderProfile)}` : ''

  const prompt = `Analyze this ${snapshot.market} asset and generate the analysis JSON.${profileSection}

ASSET: ${snapshot.ticker} (${snapshot.market.toUpperCase()})
Current Price: $${snapshot.currentPrice}
24h Change: ${snapshot.percentChange24h > 0 ? '+' : ''}${snapshot.percentChange24h}%
24h Volume: ${snapshot.volume24h.toLocaleString()}
Volume vs 20-day avg: ${volumeRatio ? `${volumeRatio}x` : 'N/A'}

TECHNICAL INDICATORS:
RSI (14): ${snapshot.rsi}
MACD Value: ${snapshot.macd.value}
MACD Signal: ${snapshot.macd.signal}
MACD Histogram: ${snapshot.macd.histogram}
Bollinger Upper: $${snapshot.bollingerBands.upper}
Bollinger Middle (SMA20): $${snapshot.bollingerBands.middle}
Bollinger Lower: $${snapshot.bollingerBands.lower}
${snapshot.vwap ? `VWAP: $${snapshot.vwap}` : ''}

RECENT PRICE ACTION (last 5 closes):
${snapshot.ohlcv.slice(-5).map(c =>
  `  ${new Date(c.timestamp).toLocaleDateString()}: O:${c.open} H:${c.high} L:${c.low} C:${c.close}`
).join('\n')}${stanceSection(previousStance)}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 800,
    // Small structured-JSON task on a tight token budget — no extended
    // thinking (Sonnet 5 runs adaptive thinking by default when omitted).
    thinking: { type: 'disabled' },
    system: BASE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

  return {
    ticker: snapshot.ticker,
    market: snapshot.market,
    signal_type: parsed.signal_type,
    confidence: parsed.confidence,
    price: snapshot.currentPrice,
    entry_low: parsed.entry_low ?? null,
    entry_high: parsed.entry_high ?? null,
    target_price: parsed.target_price ?? null,
    stop_loss: parsed.stop_loss ?? null,
    rsi: snapshot.rsi,
    macd_signal: parsed.macd_signal ?? null,
    volume_ratio: volumeRatio,
    ai_reasoning: parsed.ai_reasoning,
    simple_reasoning: parsed.simple_summary ?? '',
    chart_closes: buildChartSeries(snapshot),
    percent_change_24h: snapshot.percentChange24h ?? null,
    ath_change_pct: snapshot.athChangePct ?? null,
    ath_price: snapshot.athPrice ?? null,
  }
}

// Compact series for the expanded-card chart: the ~30 most recent closes,
// each with the 20-period average at that point when enough history exists.
function buildChartSeries(snapshot: MarketSnapshot) {
  const all = snapshot.ohlcv
  const closes = all.map(c => c.close)
  const pts = all.slice(-30)
  const offset = all.length - pts.length
  return pts.map((c, idx) => {
    const end = offset + idx + 1
    const point: { t: number; c: number; m?: number } = { t: c.timestamp, c: c.close }
    if (end >= 20) {
      const avg = closes.slice(end - 20, end).reduce((a, b) => a + b, 0) / 20
      point.m = Number(avg.toPrecision(6))
    }
    return point
  })
}

export async function generateAndCacheAllSignals(
  snapshots: MarketSnapshot[],
  traderProfile: TraderProfile | null = null
) {
  const supabase = createAdminClient()
  const results: GeneratedSignal[] = []

  // Read the outgoing stances first — they feed the stickiness rules in the
  // prompt, and are reused afterwards to detect which tickers actually changed.
  const { data: prevRows } = await supabase
    .from('signals')
    .select('ticker, signal_type')
    .gt('expires_at', new Date().toISOString())
  const previousByTicker = new Map<string, string>(
    (prevRows ?? []).map(r => [r.ticker as string, r.signal_type as string])
  )

  for (let i = 0; i < snapshots.length; i += 4) {
    const batch = snapshots.slice(i, i + 4)
    const batchResult = await Promise.allSettled(
      batch.map(s => generateSignalForAsset(s, traderProfile, previousByTicker.get(s.ticker)))
    )
    batchResult.forEach(r => {
      if (r.status === 'fulfilled') results.push(r.value)
      else console.error('Signal generation failed:', r.reason)
    })
    if (i + 4 < snapshots.length) await new Promise(r => setTimeout(r, 1000))
  }

  await supabase.from('signals').delete().lt('expires_at', new Date().toISOString())

  // Replace any still-fresh rows for the tickers we're about to insert, so
  // overlapping runs don't leave duplicate cards on the dashboard. Tickers
  // not in this batch (e.g. crypto when only stocks refreshed) keep their
  // previous unexpired signals.
  if (results.length > 0) {
    await supabase.from('signals').delete().in('ticker', results.map(s => s.ticker))
  }

  const { error } = await supabase.from('signals').insert(
    results.map(s => ({
      ...s,
      generated_at: new Date().toISOString(),
      // Kept fresh for 2.5h so cached signals never lapse between the
      // 2-hourly cron refreshes (the 0.5h buffer absorbs cron timing jitter
      // or a single slow run, avoiding an expensive on-demand regeneration).
      expires_at: new Date(Date.now() + 150 * 60 * 1000).toISOString(),
    }))
  )

  if (error) console.error('Failed to cache signals:', error)

  // Alerts run before the history write on purpose: the alert cooldown asks
  // signal_history "has this ticker changed recently?", and recording this
  // run's flips first would make every ticker look like its own precedent.
  try {
    await sendSignalChangeAlerts(previousByTicker, results)
  } catch (err) {
    console.error('Signal-change alerts failed:', err)
  }

  // Permanently record signal flips (and first sightings) for the public
  // track-record page. Append-only; never blocks signal generation.
  try {
    const flips = results
      .filter(s => previousByTicker.get(s.ticker) !== s.signal_type)
      .map(s => ({
        ticker: s.ticker,
        market: s.market,
        signal_type: s.signal_type,
        previous_type: previousByTicker.get(s.ticker) ?? null,
        confidence: s.confidence,
        price: s.price,
        generated_at: new Date().toISOString(),
      }))
    if (flips.length > 0) {
      const { error: histError } = await supabase.from('signal_history').insert(flips)
      if (histError) console.error('Failed to record signal history:', histError)
    }
  } catch (err) {
    console.error('Signal history recording failed:', err)
  }

  return results
}

export async function getTraderProfile(userId: string): Promise<TraderProfile | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('trader_profiles')
    .select('trade_style, profit_target, risk_tolerance')
    .eq('user_id', userId)
    .single()
  return data ?? null
}
