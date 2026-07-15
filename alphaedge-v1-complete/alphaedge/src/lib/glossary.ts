// ── Plain-English trading glossary ────────────────────────
// Used by the tap-to-explain tooltips in signal cards and the /learn page.
// Definitions are deliberately jargon-free — written for someone who has
// never traded before.

export const GLOSSARY: { term: string; aliases?: string[]; definition: string }[] = [
  {
    term: 'RSI',
    definition: 'A 0–100 score of how fast the price has been rising or falling lately. Above 70 usually means it climbed unusually fast (may be due for a breather); below 30 means it fell unusually fast (may be due for a bounce).',
  },
  {
    term: 'MACD',
    definition: 'A momentum gauge that compares the recent trend to the longer trend. When it turns positive, momentum is shifting upward; negative means momentum is fading.',
  },
  {
    term: 'histogram',
    definition: 'The part of the MACD that shows how strongly momentum is building or fading — taller bars mean a stronger push in that direction.',
  },
  {
    term: 'crossover',
    aliases: ['bullish crossover', 'bearish crossover'],
    definition: 'The moment one trend line overtakes another — traders watch it as an early hint that the price direction may be changing.',
  },
  {
    term: 'SMA',
    aliases: ['20-day SMA', 'moving average'],
    definition: 'The average price over a stretch of days (the 20-day average smooths out daily noise). Price above its average suggests an uptrend; below suggests a downtrend.',
  },
  {
    term: 'Bollinger Band',
    aliases: ['Bollinger Bands', 'upper Bollinger Band', 'lower Bollinger Band'],
    definition: 'A "normal range" drawn around the average price. Touching the upper band means the price is stretched high; the lower band means stretched low.',
  },
  {
    term: 'VWAP',
    definition: 'The average price weighted by how much trading happened at each level — roughly the "fair price" most people paid today.',
  },
  {
    term: 'support',
    aliases: ['support zone', 'support level', 'key support'],
    definition: 'A price area where buyers have repeatedly stepped in before, often stopping a fall — like a floor the price tends to bounce off.',
  },
  {
    term: 'resistance',
    aliases: ['resistance level', 'next resistance'],
    definition: 'A price area where sellers have repeatedly stepped in before, often stopping a rise — like a ceiling the price struggles to break through.',
  },
  {
    term: 'breakout',
    definition: 'When the price pushes through a ceiling (resistance) or floor (support) it had been stuck at — often the start of a bigger move.',
  },
  {
    term: 'overbought',
    definition: 'The price has climbed unusually fast and may be temporarily expensive — buyers may pause or take profits soon.',
  },
  {
    term: 'oversold',
    definition: 'The price has dropped unusually fast and may be temporarily cheap — sellers may be running out of steam.',
  },
  {
    term: 'volume',
    aliases: ['volume confirmation', 'trading volume'],
    definition: 'How much of the asset changed hands. Big moves on high volume are more trustworthy; moves on thin volume fizzle more often.',
  },
  {
    term: 'stop loss',
    aliases: ['stop-loss'],
    definition: 'A pre-decided exit price to limit losses if a trade goes the wrong way — the "get out here" line.',
  },
  {
    term: 'entry zone',
    aliases: ['entry'],
    definition: 'The price range the analysis considers a reasonable area to start a position, based on nearby support.',
  },
  {
    term: 'consolidation',
    aliases: ['consolidating'],
    definition: 'The price moving sideways in a narrow range while buyers and sellers are balanced — often the calm before the next real move.',
  },
  {
    term: 'momentum',
    definition: 'The speed and strength of a price move. Rising momentum means the move is gathering force; fading momentum means it is running out of energy.',
  },
  {
    term: 'pullback',
    definition: 'A small, temporary dip during a larger rise — often watched as a cheaper moment to get in rather than a reason to worry.',
  },
]

// Longest-first so multi-word aliases match before their shorter parents
// (e.g. "support zone" before "support").
export const GLOSSARY_LOOKUP: { phrase: string; definition: string }[] = GLOSSARY
  .flatMap(g => [g.term, ...(g.aliases ?? [])].map(phrase => ({ phrase, definition: g.definition })))
  .sort((a, b) => b.phrase.length - a.phrase.length)
