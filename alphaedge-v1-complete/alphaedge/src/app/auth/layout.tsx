import type { Metadata } from 'next'

// Covers /auth and /auth/reset: sign-in flows have no business in search results.
export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
