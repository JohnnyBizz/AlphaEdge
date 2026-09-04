import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// Only public routes belong here; auth-gated segments are noindexed via their
// own layouts. The root route is omitted because
// it only redirects (anonymous visitors are sent to the noindexed /auth), so
// /learn stands in as the indexable front door.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/learn`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/track-record`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/disclaimer`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
