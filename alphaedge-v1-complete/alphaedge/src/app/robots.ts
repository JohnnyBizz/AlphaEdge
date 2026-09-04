import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// Gated segments (/auth, /dashboard, /onboarding, /practice) are deliberately
// not disallowed: they rely on their layouts' noindex, which crawlers can only
// see if they are allowed to fetch the pages.
// /api/track-record stays fetchable (longest-match beats the /api/ block)
// because /track-record renders client-side from it — blocking it would make
// crawlers index that page as its loading skeleton.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/track-record'],
      disallow: ['/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
