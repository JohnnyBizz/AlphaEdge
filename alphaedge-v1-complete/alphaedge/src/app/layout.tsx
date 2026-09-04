import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ServiceWorker from '@/components/ServiceWorker'
import { SITE_URL } from '@/lib/seo'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const description =
  'AlphaEdge uses AI to explain technical analysis of cryptocurrencies in plain English — indicators, momentum, and risk, for learning only. Not financial advice.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AlphaEdge — AI Market Analysis',
    template: '%s — AlphaEdge',
  },
  description,
  manifest: '/manifest.json',
  applicationName: 'AlphaEdge',
  // No url here: og:url would be inherited verbatim by every child route,
  // pointing all shares at one address instead of each page's own.
  openGraph: {
    type: 'website',
    siteName: 'AlphaEdge',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'AlphaEdge',
    // Dark bar to match the app's own background, so the status area doesn't
    // sit as a white strip above a near-black page once installed.
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0d12',
  width: 'device-width',
  initialScale: 1,
  // Installed apps should respect the notch/home indicator rather than
  // drawing underneath them.
  viewportFit: 'cover',
}

// Organization and WebSite anchor the site's identity at the origin; only the
// WebApplication node points at /learn, the app's public landing page (the
// root route itself just redirects).
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'AlphaEdge',
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
    },
    {
      '@type': 'WebSite',
      name: 'AlphaEdge',
      url: SITE_URL,
    },
    {
      '@type': 'WebApplication',
      name: 'AlphaEdge',
      applicationCategory: 'FinanceApplication',
      description,
      url: `${SITE_URL}/learn`,
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ServiceWorker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
