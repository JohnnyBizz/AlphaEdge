// ── Paper trading portfolio math ──────────────────────────
// Cash and holdings are derived from the trade ledger rather than stored,
// so there is no balance that can drift away from the trades behind it.
// Shared by the API and the practice page so both agree by construction.

export const STARTING_BALANCE = 10_000

export interface PaperTrade {
  id: string
  ticker: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  signal_at_trade: string | null
  created_at: string
}

export interface Holding {
  ticker: string
  quantity: number
  /** Average price paid across the buys that built the current position. */
  avg_cost: number
  current_price: number | null
  market_value: number | null
  unrealized_pl: number | null
  unrealized_pl_pct: number | null
}

export interface Portfolio {
  cash: number
  holdings: Holding[]
  holdings_value: number
  total_value: number
  /** Profit/loss against the starting balance, in dollars and percent. */
  total_pl: number
  total_pl_pct: number
  /** Banked profit/loss from positions already sold. */
  realized_pl: number
  starting_balance: number
}

/**
 * Replays the ledger oldest-first to produce current cash and holdings.
 *
 * Cost basis is a running average: selling reduces the position but leaves
 * the average price untouched, which is what makes the remaining holding's
 * unrealized P/L comparable to what it was before the sale.
 */
export function buildPortfolio(
  trades: PaperTrade[],
  priceNow: Map<string, number>,
): Portfolio {
  const ordered = [...trades].sort((a, b) => a.created_at.localeCompare(b.created_at))

  let cash = STARTING_BALANCE
  let realized = 0
  const positions = new Map<string, { quantity: number; avgCost: number }>()

  for (const t of ordered) {
    const pos = positions.get(t.ticker) ?? { quantity: 0, avgCost: 0 }
    const value = t.quantity * t.price

    if (t.side === 'buy') {
      const totalCost = pos.avgCost * pos.quantity + value
      pos.quantity += t.quantity
      pos.avgCost = pos.quantity > 0 ? totalCost / pos.quantity : 0
      cash -= value
    } else {
      const sold = Math.min(t.quantity, pos.quantity)
      realized += (t.price - pos.avgCost) * sold
      pos.quantity -= sold
      cash += value
      if (pos.quantity <= 0) { pos.quantity = 0; pos.avgCost = 0 }
    }
    positions.set(t.ticker, pos)
  }

  const holdings: Holding[] = Array.from(positions.entries())
    // A fully sold position stays in the map with quantity 0; it belongs in
    // the trade history, not in the holdings list.
    .filter(([, p]) => p.quantity > 1e-12)
    .map(([ticker, p]) => {
      const current = priceNow.get(ticker) ?? null
      const marketValue = current != null ? p.quantity * current : null
      const cost = p.avgCost * p.quantity
      return {
        ticker,
        quantity: p.quantity,
        avg_cost: p.avgCost,
        current_price: current,
        market_value: marketValue,
        unrealized_pl: marketValue != null ? marketValue - cost : null,
        unrealized_pl_pct: marketValue != null && cost > 0 ? ((marketValue / cost) - 1) * 100 : null,
      }
    })
    .sort((a, b) => (b.market_value ?? 0) - (a.market_value ?? 0))

  // A holding with no live price contributes nothing rather than a guess —
  // better a total that's briefly light than one built on a stale figure.
  const holdingsValue = holdings.reduce((sum, h) => sum + (h.market_value ?? 0), 0)
  const totalValue = cash + holdingsValue

  return {
    cash,
    holdings,
    holdings_value: holdingsValue,
    total_value: totalValue,
    total_pl: totalValue - STARTING_BALANCE,
    total_pl_pct: ((totalValue / STARTING_BALANCE) - 1) * 100,
    realized_pl: realized,
    starting_balance: STARTING_BALANCE,
  }
}

/** Quantity of a ticker currently held — used to validate sells. */
export function heldQuantity(trades: PaperTrade[], ticker: string): number {
  return trades.reduce((qty, t) => {
    if (t.ticker !== ticker) return qty
    return t.side === 'buy' ? qty + t.quantity : qty - t.quantity
  }, 0)
}
