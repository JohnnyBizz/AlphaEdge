// ── Market Data Fetcher ───────────────────────────────────
// Fetches OHLCV from Polygon.io (stocks) and CoinGecko (crypto),
// then computes technical indicators server-side.

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

// ── Technical Indicators ──────────────────────────────────

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
  const rs = avgGain / avgLoss
  return Math.round(100 - 100 / (1 + rs))
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

// ── Stock Data (Polygon.io) ───────────────────────────────

export async function fetchStockSnapshot(ticker: string): Promise<MarketSnapshot> {
  const apiKey = process.env.POLYGON_API_KEY!
  const to = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [aggRes, snapshotRes] = await Promise.all([
    fetch(`${POLYGON_BASE}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=60&apiKey=${apiKey}`),
    fetch(`${POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}?apiKey=${apiKey}`),
  ])

  const [aggData, snapshotData] = await Promise.all([aggRes.json(), snapshotRes.json()])

  const results: any[] = aggData.results ?? []
  const snap = snapshotData.ticker ?? {}

  const ohlcv: OHLCV[] = results.map((r: any) => ({
    timestamp: r.t, open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v,
  }))

  const closes = ohlcv.map(c => c.close)
  const volumes = ohlcv.map(c => c.volume)
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20

  const currentPrice = snap.day?.c ?? closes[closes.length - 1]
  const prevClose = snap.prevDay?.c ?? closes[closes.length - 2]
  const priceChange = currentPrice - prevClose

  return {
    ticker,
    market: 'stock',
    currentPrice,
    priceChange24h: parseFloat(priceChange.toFixed(2)),
    percentChange24h: parseFloat(((priceChange / prevClose) * 100).toFixed(2)),
    volume24h: snap.day?.v ?? 0,
    volumeAvg20d: parseFloat(avgVolume.toFixed(0)),
    ohlcv,
    rsi: calcRSI(closes),
    macd: calcMACD(closes),
    bollingerBands: calcBollingerBands(closes),
    vwap: snap.day?.vw ?? null,
  }
}

// ── Crypto Data (CoinGecko) ───────────────────────────────

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  DOGE: 'dogecoin', ADA: 'cardano', AVAX: 'avalanche-2',
  LINK: 'chainlink', DOT: 'polkadot', MATIC: 'matic-network',
}

export async function fetchCryptoSnapshot(ticker: string): Promise<MarketSnapshot> {
  const coinId = COINGECKO_IDS[ticker] ?? ticker.toLowerCase()
  const apiKey = process.env.COINGECKO_API_KEY

  const headers: Record<string, string> = apiKey ? { 'x-cg-demo-api-key': apiKey } : {}

  const [marketRes, ohlcvRes] = await Promise.all([
    fetch(`${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&community_data=false`, { headers }),
    fetch(`${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=60`, { headers }),
  ])

  const [market, ohlcvRaw] = await Promise.all([marketRes.json(), ohlcvRes.json()])

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

// ── Batch fetcher ─────────────────────────────────────────

export const TRACKED_ASSETS = {
  stocks: ['NVDA', 'AAPL', 'MSFT', 'META', 'GOOGL', 'AMZN', 'TSLA', 'AMD'],
  crypto: ['BTC', 'ETH', 'SOL', 'BNB', 'AVAX'],
}

export async function fetchAllMarketData(): Promise<MarketSnapshot[]> {
  const stockPromises = TRACKED_ASSETS.stocks.map(t =>
    fetchStockSnapshot(t).catch(e => { console.error(`Stock fetch failed: ${t}`, e); return null })
  )
  const cryptoPromises = TRACKED_ASSETS.crypto.map(t =>
    fetchCryptoSnapshot(t).catch(e => { console.error(`Crypto fetch failed: ${t}`, e); return null })
  )

  const results = await Promise.all([...stockPromises, ...cryptoPromises])
  return results.filter(Boolean) as MarketSnapshot[]
}
