import type { Metadata } from 'next'

// The page itself is a client component, so metadata lives in this layout.
export const metadata: Metadata = {
  title: 'AI Signal Track Record for Crypto',
  description:
    "A public, timestamped log of the AI's recent signal changes on crypto assets, with the price at each call and how price has moved since. Educational only.",
  alternates: { canonical: '/track-record' },
}

export default function TrackRecordLayout({ children }: { children: React.ReactNode }) {
  return children
}
