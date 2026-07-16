// ── Market Data Fetcher ───────────────────────────────────
// CoinGecko (crypto) + computed indicators. AlphaEdge is crypto-only.

import { CRYPTO_ASSETS } from './assets'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

export interface OHLCV {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketSnapshot {
  ticker: string
  market: 'stock' | 'crypto'
  currentPrice: number
  priceChange24h: number
  percentChange24h: number
  volume24h: number
  volumeAvg20d: number
  ohlcv: OHLCV[]
  rsi: number
  macd: { value: number; signal: number; histogram: number }
  bollingerBands: { upper: number; middle: number; lower: number }
  vwap: number | null
  marketCap?: number
  // Crypto only: % distance from all-time high (negative = below ATH)
  athChangePct?: number | null
}

// ── Technical indicators ──────────────────────────────────

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50
  let gains = 0, losses = 0
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses += Math.abs(diff)
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  return Math.round(100 - 100 / (1 + avgGain / avgLoss))
}

function calcEMA(values: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const emas: number[] = [values[0]]
  for (let i = 1; i < values.length; i++) {
    emas.push(values[i] * k + emas[i - 1] * (1 - k))
  }
  return emas
}

function calcMACD(closes: number[]) {
  const ema12 = calcEMA(closes, 12)
  const ema26 = calcEMA(closes, 26)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const signalLine = calcEMA(macdLine, 9)
  const last = macdLine.length - 1
  return {
    value: parseFloat(macdLine[last].toFixed(4)),
    signal: parseFloat(signalLine[last].toFixed(4)),
    histogram: parseFloat((macdLine[last] - signalLine[last]).toFixed(4)),
  }
}

function calcBollingerBands(closes: number[], period = 20) {
  const slice = closes.slice(-period)
  const middle = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - middle, 2), 0) / period
  const stdDev = Math.sqrt(variance)
  return {
    upper: parseFloat((middle + 2 * stdDev).toFixed(2)),
    middle: parseFloat(middle.toFixed(2)),
    lower: parseFloat((middle - 2 * stdDev).toFixed(2)),
  }
}

// ── Crypto (CoinGecko) ────────────────────────────────────

const COINGECKO_IDS: Record<string, string> = Object.fromEntries(
  CRYPTO_ASSETS.map(a => [a.ticker, a.coingeckoId])
)

export async function fetchCryptoSnapshot(ticker: string): Promise<MarketSnapshot> {
  const coinId = COINGECKO_IDS[ticker] ?? ticker.toLowerCase()
  const apiKey = process.env.COINGECKO_API_KEY
  // Paid CoinGecko keys (Basic and up) authenticate against the pro host
  // with the pro header — they are rejected by the public host's demo
  // header. Without a key, fall back to the public (keyless) host.
  const base = apiKey ? 'https://pro-api.coingecko.com/api/v3' : COINGECKO_BASE
  const headers: Record<string, string> = apiKey ? { 'x-cg-pro-api-key': apiKey } : {}

  const [marketRes, ohlcvRes] = await Promise.all([
    fetch(`${base}/coins/${coinId}?localization=false&tickers=false&community_data=false`, { headers }),
    // Note: CoinGecko's OHLC endpoint only accepts days=1|7|14|30|90|180|365
    // (60 is rejected with a 400). 180 days yields ~45 four-day candles —
    // enough history for the RSI/MACD/Bollinger calculations.
    fetch(`${base}/coins/${coinId}/ohlc?vs_currency=usd&days=180`, { headers }),
  ])

  if (!marketRes.ok || !ohlcvRes.ok) {
    // CoinGecko rate-limit errors come back as plain text ("Throttled"), not JSON
    throw new Error(`CoinGecko ${marketRes.ok ? ohlcvRes.status : marketRes.status} for ${ticker}: ${(await (marketRes.ok ? ohlcvRes : marketRes).text()).slice(0, 200)}`)
  }

  const [market, ohlcvRaw] = await Promise.all([marketRes.json(), ohlcvRes.json()])

  if (!Array.isArray(ohlcvRaw)) {
    throw new Error(`CoinGecko returned unexpected OHLCV payload for ${ticker}: ${JSON.stringify(ohlcvRaw).slice(0, 200)}`)
  }

  const ohlcv: OHLCV[] = (ohlcvRaw as number[][]).map(([t, o, h, l, c]) => ({
    timestamp: t, open: o, high: h, low: l, close: c, volume: 0,
  }))

  const closes = ohlcv.map(c => c.close)
  const md = market.market_data ?? {}

  return {
    ticker,
    market: 'crypto',
    currentPrice: md.current_price?.usd ?? 0,
    priceChange24h: md.price_change_24h ?? 0,
    percentChange24h: md.price_change_percentage_24h ?? 0,
    volume24h: md.total_volume?.usd ?? 0,
    volumeAvg20d: 0,
    ohlcv,
    rsi: calcRSI(closes),
    macd: calcMACD(closes),
    bollingerBands: calcBollingerBands(closes),
    vwap: null,
    marketCap: md.market_cap?.usd ?? 0,
    athChangePct: md.ath_change_percentage?.usd ?? null,
  }
}

// ── Batch fetch all tracked assets ────────────────────────

// `stocks` kept as an empty list so callers importing TRACKED_ASSETS.stocks
// (e.g. position validation) keep working; AlphaEdge tracks crypto only.
export const TRACKED_ASSETS = {
  stocks: [] as string[],
  crypto: CRYPTO_ASSETS.map(a => a.ticker),
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function fetchAllMarketData(): Promise<MarketSnapshot[]> {
  // With a paid CoinGecko key (Basic: well above 100 req/min) coins can be
  // fetched in parallel batches — 8 coins = 16 requests per batch, with a
  // 1s pause between batches, stays comfortably under the limit. Without a
  // key, the public host allows ~30 req/min, so fall back to slow pacing.
  const hasPaidKey = !!process.env.COINGECKO_API_KEY
  const cryptoResults: (MarketSnapshot | null)[] = []

  if (hasPaidKey) {
    for (let i = 0; i < TRACKED_ASSETS.crypto.length; i += 8) {
      const batch = TRACKED_ASSETS.crypto.slice(i, i + 8)
      const settled = await Promise.all(
        batch.map(t =>
          fetchCryptoSnapshot(t).catch(e => { console.error(`Crypto fetch failed: ${t}`, e); return null })
        )
      )
      cryptoResults.push(...settled)
      if (i + 8 < TRACKED_ASSETS.crypto.length) await sleep(1000)
    }
  } else {
    for (const t of TRACKED_ASSETS.crypto) {
      cryptoResults.push(
        await fetchCryptoSnapshot(t).catch(e => { console.error(`Crypto fetch failed: ${t}`, e); return null })
      )
      await sleep(4500)
    }
  }

  return cryptoResults.filter(Boolean) as MarketSnapshot[]
}
