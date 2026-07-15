'use client'

import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip,
  ReferenceArea, ReferenceLine, CartesianGrid,
} from 'recharts'

// Expanded-card price chart: recent closes as a single line, with the
// levels from the analysis drawn on top so the numbers in the boxes
// below are visible in context — the shaded band is the support zone,
// green dashes the next resistance, red dashes the key support break.

type Close = { t: number; c: number }

const LINE = '#5b8def'      // price series (validated vs dark surface)
const GREEN = '#00e5a0'     // matches var(--accent)
const RED = '#f04a4a'       // matches var(--red)
const MUTED = '#4a5568'     // matches var(--text-muted)

function compactPrice(v: number) {
  if (v >= 10000) return `$${(v / 1000).toFixed(v >= 100000 ? 0 : 1)}k`
  if (v >= 1000) return `$${Math.round(v).toLocaleString('en-US')}`
  if (v >= 1) return `$${v.toFixed(2)}`
  if (v >= 0.01) return `$${v.toFixed(4)}`
  // Sub-cent coins (SHIB, etc.) need significant digits, not fixed decimals
  return v > 0 ? `$${v.toPrecision(3)}` : '$0'
}

// Axis ticks read better without cents on triple-digit prices
function axisPrice(v: number) {
  if (v >= 100 && v < 1000) return `$${Math.round(v)}`
  return compactPrice(v)
}

function shortDate(t: number) {
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ChartTooltip({ active, payload }: {
  active?: boolean
  payload?: { payload: Close }[]
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="px-2.5 py-1.5 rounded-lg text-xs"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hover)' }}>
      <div style={{ color: 'var(--text-muted)' }}>{shortDate(p.t)}</div>
      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{compactPrice(p.c)}</div>
    </div>
  )
}

export default function SignalChart({ closes, entryLow, entryHigh, target, stop }: {
  closes: Close[]
  entryLow: number | null
  entryHigh: number | null
  target: number | null
  stop: number | null
}) {
  if (!closes || closes.length < 5) return null

  const values = closes.map(c => c.c)
  for (const lvl of [entryLow, entryHigh, target, stop]) {
    if (lvl !== null && lvl > 0) values.push(lvl)
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.06 || max * 0.01

  const refLabel = (text: string, color: string) => ({
    value: text, position: 'insideBottomRight' as const, fill: color, fontSize: 9,
  })

  return (
    <div style={{ width: '100%', height: 180 }} onClick={e => e.stopPropagation()}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={closes} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={shortDate}
            ticks={[closes[0].t, closes[Math.floor(closes.length / 2)].t, closes[closes.length - 1].t]}
            tick={{ fill: MUTED, fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tickFormatter={axisPrice}
            tick={{ fill: MUTED, fontSize: 10 }}
            tickCount={4} width={52}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: MUTED, strokeDasharray: '3 3' }} />

          {entryLow !== null && entryHigh !== null && (
            <ReferenceArea
              y1={entryLow} y2={entryHigh}
              fill={GREEN} fillOpacity={0.08} stroke="none"
              label={refLabel('Support zone', GREEN)}
            />
          )}
          {target !== null && (
            <ReferenceLine
              y={target} stroke={GREEN} strokeDasharray="4 4" strokeOpacity={0.8}
              label={refLabel('Next resistance', GREEN)}
            />
          )}
          {stop !== null && (
            <ReferenceLine
              y={stop} stroke={RED} strokeDasharray="4 4" strokeOpacity={0.8}
              label={refLabel('Key support break', RED)}
            />
          )}

          <Line
            type="monotone" dataKey="c"
            stroke={LINE} strokeWidth={2}
            dot={false} activeDot={{ r: 4, fill: LINE, stroke: 'var(--bg-secondary)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
