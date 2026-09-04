// Canonical origin for absolute URLs (metadata, sitemap, robots, JSON-LD,
// email links). NEXT_PUBLIC_APP_URL overrides per environment; the fallback
// is the production domain, so preview deploys under other hostnames still
// emit canonical production URLs unless explicitly told otherwise.
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alphaedge.network'
