// ── Tracked asset catalog ─────────────────────────────────
// Single source of truth for every asset AlphaEdge analyzes.
// Safe to import from client components (no secrets, data only).
//
// AlphaEdge is crypto-only: crypto market data can be commercially
// licensed cheaply (CoinGecko), whereas equities carry heavy exchange
// redistribution fees that don't fit a lean subscription product.

export const CRYPTO_ASSETS: { ticker: string; name: string; coingeckoId: string }[] = [
  // Majors
  { ticker: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin' },
  { ticker: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum' },
  { ticker: 'SOL', name: 'Solana', coingeckoId: 'solana' },
  { ticker: 'BNB', name: 'BNB', coingeckoId: 'binancecoin' },
  { ticker: 'XRP', name: 'XRP', coingeckoId: 'ripple' },
  { ticker: 'ADA', name: 'Cardano', coingeckoId: 'cardano' },
  { ticker: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2' },
  { ticker: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin' },
  { ticker: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink' },
  { ticker: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot' },

  // Established alts
  { ticker: 'LTC', name: 'Litecoin', coingeckoId: 'litecoin' },
  { ticker: 'TRX', name: 'TRON', coingeckoId: 'tron' },
  { ticker: 'TON', name: 'Toncoin', coingeckoId: 'the-open-network' },
  { ticker: 'XLM', name: 'Stellar', coingeckoId: 'stellar' },
  { ticker: 'UNI', name: 'Uniswap', coingeckoId: 'uniswap' },
  { ticker: 'NEAR', name: 'NEAR Protocol', coingeckoId: 'near' },
  { ticker: 'SUI', name: 'Sui', coingeckoId: 'sui' },
  { ticker: 'BCH', name: 'Bitcoin Cash', coingeckoId: 'bitcoin-cash' },
  { ticker: 'ATOM', name: 'Cosmos', coingeckoId: 'cosmos' },
  { ticker: 'APT', name: 'Aptos', coingeckoId: 'aptos' },
  { ticker: 'ARB', name: 'Arbitrum', coingeckoId: 'arbitrum' },
  { ticker: 'OP', name: 'Optimism', coingeckoId: 'optimism' },
  { ticker: 'FIL', name: 'Filecoin', coingeckoId: 'filecoin' },
  { ticker: 'HBAR', name: 'Hedera', coingeckoId: 'hedera-hashgraph' },
  { ticker: 'VET', name: 'VeChain', coingeckoId: 'vechain' },
  { ticker: 'AAVE', name: 'Aave', coingeckoId: 'aave' },
  { ticker: 'ALGO', name: 'Algorand', coingeckoId: 'algorand' },
  { ticker: 'ETC', name: 'Ethereum Classic', coingeckoId: 'ethereum-classic' },
  { ticker: 'INJ', name: 'Injective', coingeckoId: 'injective-protocol' },
  { ticker: 'POL', name: 'Polygon', coingeckoId: 'polygon-ecosystem-token' },
  { ticker: 'XMR', name: 'Monero', coingeckoId: 'monero' },
  { ticker: 'KAS', name: 'Kaspa', coingeckoId: 'kaspa' },
  { ticker: 'GRT', name: 'The Graph', coingeckoId: 'the-graph' },
  { ticker: 'TIA', name: 'Celestia', coingeckoId: 'celestia' },
  { ticker: 'SEI', name: 'Sei', coingeckoId: 'sei-network' },
  { ticker: 'IMX', name: 'Immutable', coingeckoId: 'immutable-x' },
  { ticker: 'FLR', name: 'Flare', coingeckoId: 'flare-networks' },
  { ticker: 'WLFI', name: 'World Liberty Financial', coingeckoId: 'world-liberty-financial' },

  // AI-narrative coins (heavily traded theme)
  { ticker: 'TAO', name: 'Bittensor', coingeckoId: 'bittensor' },
  { ticker: 'FET', name: 'Fetch.ai', coingeckoId: 'fetch-ai' },
  { ticker: 'RENDER', name: 'Render', coingeckoId: 'render-token' },

  // Trending / meme (heavily searched by newer traders)
  { ticker: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu' },
  { ticker: 'PEPE', name: 'Pepe', coingeckoId: 'pepe' },
  { ticker: 'BONK', name: 'Bonk', coingeckoId: 'bonk' },
  { ticker: 'WIF', name: 'dogwifhat', coingeckoId: 'dogwifcoin' },
  { ticker: 'FLOKI', name: 'Floki', coingeckoId: 'floki' },
]

export const ASSET_NAMES: Record<string, string> = Object.fromEntries(
  CRYPTO_ASSETS.map(a => [a.ticker, a.name])
)
