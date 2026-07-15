// ── Tracked asset catalog ─────────────────────────────────
// Single source of truth for every asset AlphaEdge analyzes.
// Safe to import from client components (no secrets, data only).
//
// Global coverage uses US-listed ADRs and region ETFs, so everything
// here is fetchable through the existing Polygon (stocks) and
// CoinGecko (crypto) integrations.

export type StockRegion = 'us' | 'global'

export const STOCK_ASSETS: { ticker: string; name: string; region: StockRegion }[] = [
  // US stocks
  { ticker: 'NVDA', name: 'NVIDIA', region: 'us' },
  { ticker: 'AAPL', name: 'Apple', region: 'us' },
  { ticker: 'MSFT', name: 'Microsoft', region: 'us' },
  { ticker: 'META', name: 'Meta', region: 'us' },
  { ticker: 'GOOGL', name: 'Alphabet (Google)', region: 'us' },
  { ticker: 'AMZN', name: 'Amazon', region: 'us' },
  { ticker: 'TSLA', name: 'Tesla', region: 'us' },
  { ticker: 'AMD', name: 'AMD', region: 'us' },
  { ticker: 'NFLX', name: 'Netflix', region: 'us' },
  { ticker: 'COIN', name: 'Coinbase', region: 'us' },
  { ticker: 'PLTR', name: 'Palantir', region: 'us' },
  { ticker: 'AVGO', name: 'Broadcom', region: 'us' },
  { ticker: 'JPM', name: 'JPMorgan Chase', region: 'us' },
  { ticker: 'SPY', name: 'S&P 500 (ETF)', region: 'us' },

  // Global — international companies via their US-listed ADRs
  { ticker: 'TSM', name: 'Taiwan Semiconductor', region: 'global' },
  { ticker: 'ASML', name: 'ASML · Netherlands', region: 'global' },
  { ticker: 'BABA', name: 'Alibaba · China', region: 'global' },
  { ticker: 'TM', name: 'Toyota · Japan', region: 'global' },
  { ticker: 'NVO', name: 'Novo Nordisk · Denmark', region: 'global' },
  { ticker: 'SAP', name: 'SAP · Germany', region: 'global' },
  { ticker: 'SHEL', name: 'Shell · UK', region: 'global' },

  // Global — whole-region index ETFs
  { ticker: 'EWJ', name: 'Japan Market (ETF)', region: 'global' },
  { ticker: 'VGK', name: 'Europe Market (ETF)', region: 'global' },
  { ticker: 'EEM', name: 'Emerging Markets (ETF)', region: 'global' },
]

export const CRYPTO_ASSETS: { ticker: string; name: string; coingeckoId: string }[] = [
  { ticker: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin' },
  { ticker: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum' },
  { ticker: 'SOL', name: 'Solana', coingeckoId: 'solana' },
  { ticker: 'BNB', name: 'BNB', coingeckoId: 'binancecoin' },
  { ticker: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2' },
  { ticker: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin' },
  { ticker: 'ADA', name: 'Cardano', coingeckoId: 'cardano' },
  { ticker: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink' },
  { ticker: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot' },
  { ticker: 'XRP', name: 'XRP', coingeckoId: 'ripple' },
  { ticker: 'LTC', name: 'Litecoin', coingeckoId: 'litecoin' },
  { ticker: 'TRX', name: 'TRON', coingeckoId: 'tron' },
  { ticker: 'TON', name: 'Toncoin', coingeckoId: 'the-open-network' },
  { ticker: 'XLM', name: 'Stellar', coingeckoId: 'stellar' },
  { ticker: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu' },
  { ticker: 'UNI', name: 'Uniswap', coingeckoId: 'uniswap' },
  { ticker: 'NEAR', name: 'NEAR Protocol', coingeckoId: 'near' },
  { ticker: 'SUI', name: 'Sui', coingeckoId: 'sui' },
]

export const GLOBAL_STOCK_TICKERS = new Set(
  STOCK_ASSETS.filter(a => a.region === 'global').map(a => a.ticker)
)

export const ASSET_NAMES: Record<string, string> = Object.fromEntries(
  [...STOCK_ASSETS, ...CRYPTO_ASSETS].map(a => [a.ticker, a.name])
)
