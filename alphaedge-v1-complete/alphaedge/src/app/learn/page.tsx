import Link from 'next/link'
import { TrendingUp, BookOpen } from 'lucide-react'
import { GLOSSARY } from '@/lib/glossary'

export const metadata = {
  title: 'Learn the Basics — AlphaEdge',
  description: 'Crypto and technical analysis explained in plain English — no jargon, no hype.',
}

// Public education hub: short plain-English lessons for people who have
// never traded, matching the tone of the dashboard's simple summaries.

const LESSONS: { title: string; body: string[] }[] = [
  {
    title: 'What is cryptocurrency, really?',
    body: [
      'A cryptocurrency like Bitcoin or Ethereum is a digital asset that lives on a shared, public network instead of being issued by a company or government. There are no shares, no head office, no quarterly profits — just an asset that people buy and sell around the clock, all over the world.',
      'Its price moves because millions of people are constantly deciding what it is worth. More buyers than sellers pushes the price up; more sellers than buyers pushes it down. Nobody controls it — it is a giant, ongoing, 24/7 negotiation.',
    ],
  },
  {
    title: 'Why is crypto so much more volatile?',
    body: [
      'Because there are no earnings or products underneath it, a coin is worth exactly what the crowd feels it is worth at that moment — so sentiment moves it far more than it moves a company stock. That is why crypto can swing double digits in a day.',
      'The upside: those bigger swings are exactly what technical analysis is built to read, and crypto trades 24/7 with no market close — so the tools work every hour of every day, weekends included.',
    ],
  },
  {
    title: 'Why do traders stare at charts?',
    body: [
      'A price chart is a record of every past agreement between buyers and sellers. Chart-readers (called technical analysts) believe crowds behave in patterns: prices often stall where they stalled before, bounce where they bounced before, and move fastest when the most people agree.',
      'Technical analysis is not fortune telling — it is playing the odds. A good setup means history suggests one outcome is more likely than another. It can still go the other way, which is why risk management matters more than being right.',
    ],
  },
  {
    title: 'Floors and ceilings: support and resistance',
    body: [
      'Support is a price area where a fall has repeatedly stopped — think of it as a floor where buyers keep showing up. Resistance is the opposite: a ceiling where rises keep stalling because sellers show up.',
      'These levels matter because so many people watch them. When a price finally breaks through a ceiling, it often keeps going (a breakout) — and the old ceiling frequently becomes the new floor. On AlphaEdge charts, the shaded band is the support zone and the dashed lines mark the ceiling and the floor-break level.',
    ],
  },
  {
    title: 'What "overbought" and "oversold" mean',
    body: [
      'When a price climbs unusually far, unusually fast, traders call it overbought — not "too expensive," but "moved so fast it may need a breather." Oversold is the mirror image after a fast fall.',
      'AlphaEdge measures this with a score called RSI that runs from 0 to 100. Above 70 leans overbought, below 30 leans oversold. It is one clue, never the whole story — strong trends can stay overbought for a long time.',
    ],
  },
  {
    title: 'Momentum: is the move gathering force or fading?',
    body: [
      'Momentum asks a simple question: is this move speeding up or slowing down? A rise on growing momentum has crowd conviction behind it; a rise on fading momentum is running on fumes and often stalls.',
      'The MACD indicator you will see mentioned in our technical detail is just a momentum gauge — when it flips positive, momentum is shifting up; negative means it is shifting down.',
    ],
  },
  {
    title: 'Volume: the lie detector',
    body: [
      'Volume is how much of an asset actually changed hands. It tells you how many people backed a move with real money.',
      'A price jump on heavy volume means broad participation — more trustworthy. The same jump on thin volume means few participants, and those moves fizzle far more often. This is why our analysis keeps saying things like "wait for volume confirmation."',
    ],
  },
  {
    title: 'The 20-day average line on our charts',
    body: [
      'Take the average of the last 20 daily prices and you get a smooth line that filters out daily noise — the dashed line on AlphaEdge charts.',
      'Price above its average usually marks an uptrend; below it, a downtrend. When a falling price climbs back above its average, that is often an early sign the tide is turning — and vice versa.',
    ],
  },
  {
    title: 'Risk management: the part that actually saves you',
    body: [
      'Professionals do not try to be right every time — they make sure wins are bigger than losses. The core tool is the stop loss: a pre-decided exit price where you accept a small loss before it becomes a big one. Our analysis includes a "key support break" level for exactly this reason.',
      'Two rules cover most of it: never risk money you cannot afford to lose, and decide your exit before you enter — decisions made calmly beat decisions made in a panic, every time.',
    ],
  },
  {
    title: 'How to read an AlphaEdge signal',
    body: [
      'Every card gives a stance — BULLISH (the technicals lean positive), BEARISH (they lean negative), or NEUTRAL (mixed; wait for clarity) — plus a confidence score for how strongly the evidence agrees.',
      'Open a card and read "What this means" first, in plain English. The chart shows where the price sits against its key levels. The technical detail underneath has tap-to-explain definitions for every term. Remember: it is educational analysis to inform your own research, never an instruction to buy or sell.',
    ],
  },
]

export default function LearnPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <nav className="flex items-center justify-between px-6 py-3"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <TrendingUp size={14} color="var(--accent)" />
          </span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>AlphaEdge</span>
        </Link>
        <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--accent)', color: '#0a0d12', textDecoration: 'none' }}>
          Go to dashboard
        </Link>
      </nav>

      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BookOpen size={22} style={{ color: 'var(--accent)' }} /> Learn the basics
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Ten short lessons that explain crypto and chart-reading the way we wish someone
            had explained them to us — in plain English, no hype. Five minutes here and the dashboard
            will make a lot more sense.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {LESSONS.map((lesson, i) => (
            <details key={i} className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <summary className="p-4 cursor-pointer text-sm font-semibold flex items-center gap-3"
                style={{ color: 'var(--text-primary)', listStyle: 'none' }}>
                <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {i + 1}
                </span>
                {lesson.title}
              </summary>
              <div className="px-4 pb-4 space-y-3" style={{ marginLeft: 36 }}>
                {lesson.body.map((p, j) => (
                  <p key={j} className="text-sm leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>{p}</p>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Glossary — every term we use
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {GLOSSARY.map((g, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--accent)' }}>{g.term}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{g.definition}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl text-xs" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Educational content only — nothing on this page is financial advice. Trading and investing
          involve substantial risk of loss.{' '}
          <Link href="/disclaimer" style={{ color: 'var(--accent)' }}>Full disclaimer</Link>
          {' · '}
          <a href="mailto:support@alphaedge.network" style={{ color: 'var(--accent)' }}>Support</a>
        </div>
      </div>
    </div>
  )
}
