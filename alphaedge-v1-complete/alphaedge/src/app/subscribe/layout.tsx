import type { Metadata } from 'next'

// The page is a landing spot for signed-in users without a subscription and
// redirects anonymous visitors to /auth, so it has no business in search
// results despite living outside the other gated segments.
export const metadata: Metadata = {
  title: 'Choose a Plan',
  robots: { index: false, follow: false },
}

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return children
}
