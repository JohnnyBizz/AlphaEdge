import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ServiceWorker from '@/components/ServiceWorker'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AlphaEdge — AI Market Analysis',
  description: 'Educational AI-powered technical analysis for the top cryptocurrencies',
  manifest: '/manifest.json',
  applicationName: 'AlphaEdge',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ServiceWorker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
