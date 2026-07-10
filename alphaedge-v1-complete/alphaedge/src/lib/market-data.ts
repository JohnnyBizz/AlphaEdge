// ── Market Data Fetcher ───────────────────────────────────
// Polygon.io (stocks) + CoinGecko (crypto) + computed indicators

const POLYGON_BASE = 'https://api.polygon.io'
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

// ── Stocks (Polygon.io) ───────────────────────────────────

export async function fetchStockSnapshot(ticker: string): Promise<MarketSnapshot> {
  const apiKey = process.env.POLYGON_API_KEY!
  const to = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Single request per ticker: the daily aggregates contain everything the
  // analysis needs. (Polygon's free tier allows only 5 requests/minute, so
  // the previous extra intraday-snapshot call per ticker blew the budget.)
  const aggRes = await fetch(
    `${POLYGON_BASE}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=60&apiKey=${apiKey}`
  )

  if (!aggRes.ok) {
    throw new Error(`Polygon ${aggRes.status} for ${ticker}: ${(await aggRes.text()).slice(0, 200)}`)
  }

  const aggData = await aggRes.json()

  if (!Array.isArray(aggData.results) || aggData.results.length < 2) {
    throw new Error(`Polygon returned no OHLCV data for ${ticker}: ${JSON.stringify(aggData).slice(0, 200)}`)
  }

  const ohlcv: OHLCV[] = aggData.results.map((r: any) => ({
    timestamp: r.t, open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v,
  }))

  const closes = ohlcv.map(c => c.close)
  const volumes = ohlcv.map(c => c.volume)
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20

  const last = ohlcv[ohlcv.length - 1]
  const currentPrice = last.close
  const prevClose = closes[closes.length - 2]
  const priceChange = currentPrice - prevClose

  return {
    ticker,
    market: 'stock',
    currentPrice,
    priceChange24h: parseFloat(priceChange.toFixed(2)),
    percentChange24h: parseFloat(((priceChange / prevClose) * 100).toFixed(2)),
    volume24h: last.volume,
    volumeAvg20d: parseFloat(avgVolume.toFixed(0)),
    ohlcv,
    rsi: calcRSI(closes),
    macd: calcMACD(closes),
    bollingerBands: calcBollingerBands(closes),
    vwap: null,
  }
}

// ── Crypto (CoinGecko) ────────────────────────────────────

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  DOGE: 'dogecoin', ADA: 'cardano', AVAX: 'avalanche-2',
  LINK: 'chainlink', DOT: 'polkadot', MATIC: 'matic-network',
  XRP: 'ripple',
}

export async function fetchCryptoSnapshot(ticker: string): Promise<MarketSnapshot> {
  const coinId = COINGECKO_IDS[ticker] ?? ticker.toLowerCase()
  const apiKey = process.env.COINGECKO_API_KEY
  const headers: Record<string, string> = apiKey ? { 'x-cg-demo-api-key': apiKey } : {}

  const [marketRes, ohlcvRes] = await Promise.all([
    fetch(`${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&community_data=false`, { headers }),
    // Note: CoinGecko's OHLC endpoint only accepts days=1|7|14|30|90|180|365
    // (60 is rejected with a 400). 180 days yields ~45 four-day candles —
    // enough history for the RSI/MACD/Bollinger calculations.
    fetch(`${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=180`, { headers }),
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
  }
}

// ── Batch fetch all tracked assets ────────────────────────

export const TRACKED_ASSETS = {
  stocks: [
    'NVDA', 'AAPL', 'MSFT', 'META', 'GOOGL', 'AMZN', 'TSLA', 'AMD',
    'NFLX', 'COIN', 'PLTR', 'AVGO', 'JPM', 'SPY',
  ],
  crypto: ['BTC', 'ETH', 'SOL', 'BNB', 'AVAX', 'DOGE', 'ADA', 'LINK', 'DOT', 'XRP'],
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function fetchAllMarketData(): Promise<MarketSnapshot[]> {
  // Polygon Starter plan has no request-per-minute cap — fetch all stocks in
  // parallel. CoinGecko's demo tier (30 req/min) still needs pacing: each
  // coin is 2 requests, so 3s between coins keeps us safely under the limit.
  const stockPromises = TRACKED_ASSETS.stocks.map(t =>
    fetchStockSnapshot(t).catch(e => { console.error(`Stock fetch failed: ${t}`, e); return null })
  )

  const cryptoResults: (MarketSnapshot | null)[] = []
  for (const t of TRACKED_ASSETS.crypto) {
    cryptoResults.push(
      await fetchCryptoSnapshot(t).catch(e => { console.error(`Crypto fetch failed: ${t}`, e); return null })
    )
    await sleep(3000)
  }

  const results = [...(await Promise.all(stockPromises)), ...cryptoResults]
  return results.filter(Boolean) as MarketSnapshot[]
}
