'use client'

import { useEffect } from 'react'

// Registers the service worker that powers install-to-home-screen and push.
// Renders nothing; failures are logged and ignored, since the whole app works
// without it — the worker adds capability, it isn't load-bearing.
export default function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register('/sw.js')
      .catch(err => console.error('Service worker registration failed:', err))
  }, [])

  return null
}
