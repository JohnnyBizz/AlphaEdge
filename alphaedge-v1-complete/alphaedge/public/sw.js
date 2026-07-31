/* AlphaEdge service worker.
 *
 * Deliberately does NOT cache responses. Everything on the dashboard is a
 * live price or a fresh piece of analysis, and serving a cached copy of
 * either would show someone a number that isn't true any more — worse than
 * showing nothing. The fetch handler is a pass-through so the app still
 * qualifies as installable; offline simply shows the browser's offline page.
 *
 * Its real job is push: waking someone when an asset they hold reaches the
 * buy-in zone the analysis has been telling them to watch.
 */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', () => {
  // Network only. No respondWith, so the browser handles it normally.
})

self.addEventListener('push', event => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'AlphaEdge', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'AlphaEdge'
  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'alphaedge',
    // Replace rather than stack: three alerts about the same asset should
    // leave one notification, not three.
    renotify: Boolean(payload.tag),
    data: { url: payload.url || '/dashboard' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Focus an open tab if there is one, rather than opening a duplicate.
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
