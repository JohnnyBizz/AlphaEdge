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

  // Trending / meme (heavily searched by newer traders)
  { ticker: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu' },
  { ticker: 'PEPE', name: 'Pepe', coingeckoId: 'pepe' },
  { ticker: 'BONK', name: 'Bonk', coingeckoId: 'bonk' },
]

export const ASSET_NAMES: Record<string, string> = Object.fromEntries(
  CRYPTO_ASSETS.map(a => [a.ticker, a.name])
)
