'use client'

import { useState, useMemo } from 'react'
import { GLOSSARY_LOOKUP } from '@/lib/glossary'

// Renders analysis text with known trading terms underlined; tapping a term
// shows its plain-English definition inline. Built for the technical-detail
// block so beginners can decode jargon without leaving the card.

type Segment = { text: string; definition?: string }

function splitByGlossary(text: string): Segment[] {
  // One pass with a combined regex; longest phrases first so "support zone"
  // wins over "support".
  const pattern = new RegExp(
    `\\b(${GLOSSARY_LOOKUP.map(g => g.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  )
  const segments: Segment[] = []
  let last = 0
  for (const match of Array.from(text.matchAll(pattern))) {
    const idx = match.index ?? 0
    if (idx > last) segments.push({ text: text.slice(last, idx) })
    const hit = GLOSSARY_LOOKUP.find(g => g.phrase.toLowerCase() === match[0].toLowerCase())
    segments.push({ text: match[0], definition: hit?.definition })
    last = idx + match[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last) })
  return segments
}

export default function GlossaryText({ text }: { text: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const segments = useMemo(() => splitByGlossary(text), [text])
  const open = openIdx !== null ? segments[openIdx] : null

  return (
    <span onClick={e => e.stopPropagation()}>
      {segments.map((seg, i) =>
        seg.definition ? (
          <button key={i} type="button"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            style={{
              background: 'none', border: 'none', padding: 0, font: 'inherit',
              color: openIdx === i ? 'var(--accent)' : 'inherit',
              textDecoration: 'underline dotted', textUnderlineOffset: 3,
              cursor: 'pointer',
            }}>
            {seg.text}
          </button>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
      {open && (
        <span className="block mt-2 p-2.5 rounded-lg text-xs fade-in"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hover)', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{open.text}: </strong>
          {open.definition}
        </span>
      )}
    </span>
  )
}
