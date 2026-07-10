import Anthropic from '@anthropic-ai/sdk'
import { MarketSnapshot } from './market-data'
import { createAdminClient } from './supabase/admin'

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
  const riskMap = {
    conservative: 'conservative risk management: tight stop losses of 2–3%, only setups with 80%+ confidence',
    balanced:     'balanced risk management: standard stop losses of 4–5%, mix of safe and opportunistic analysis',
    aggressive:   'aggressive risk management: wider stop losses of 6–10%, higher-risk/higher-reward setups acceptable',
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
${p.risk_tolerance === 'conservative' ? '- Only flag BUY analysis with 3+ confirming indicators. Stop loss within 3% of entry.' : ''}
${p.risk_tolerance === 'aggressive'   ? '- Accept more risk for bigger upside. Stop loss can be 6–10% below entry.' : ''}
  `.trim()
}

// ── System prompt ─────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are a professional quantitative analyst with 20+ years of experience producing educational technical analysis.

You analyze market data including technical indicators (RSI, MACD, Bollinger Bands, VWAP, volume) to generate structured educational analysis. Your output describes what the technicals suggest — it is informational analysis, not personalized financial advice.

For each asset, return a JSON object with this exact structure:
{
  "signal_type": "buy" | "sell" | "watch",
  "confidence": <integer 0-100>,
  "entry_low": <number or null>,
  "entry_high": <number or null>,
  "target_price": <number or null>,
  "stop_loss": <number or null>,
  "macd_signal": "bullish_crossover" | "bearish_crossover" | "bullish" | "bearish" | "neutral",
  "ai_reasoning": "<2-3 sentence analysis explaining what the indicators suggest and what to watch for>"
}

Signal generation guidelines:
- BUY: RSI 30–60 with upward momentum, MACD bullish crossover, price above 20-day SMA, volume confirmation
- SELL: RSI above 70 (overbought), MACD bearish crossover, price at resistance, declining volume
- WATCH: Mixed signals, consolidation, or insufficient confirmation
- Confidence 80–100: multiple confirming indicators; 60–79: 2–3 aligned; below 60: always WATCH
- Entry zones within 1–2% of current price; never generate BUY above 80 confidence without volume confirmation

Return ONLY valid JSON, no markdown, no text outside the JSON.`

// ── Signal generation ─────────────────────────────────────

export async function generateSignalForAsset(
  snapshot: MarketSnapshot,
  traderProfile: TraderProfile | null = null
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
).join('\n')}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 600,
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
  }
}

export async function generateAndCacheAllSignals(
  snapshots: MarketSnapshot[],
  traderProfile: TraderProfile | null = null
) {
  const supabase = createAdminClient()
  const results: GeneratedSignal[] = []

  for (let i = 0; i < snapshots.length; i += 4) {
    const batch = snapshots.slice(i, i + 4)
    const batchResult = await Promise.allSettled(
      batch.map(s => generateSignalForAsset(s, traderProfile))
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
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }))
  )

  if (error) console.error('Failed to cache signals:', error)
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
