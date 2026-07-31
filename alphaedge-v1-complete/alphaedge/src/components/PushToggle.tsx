'use client'

import { useEffect, useState } from 'react'

// Lets a subscriber turn on buy-in zone alerts for assets they hold.
// Hidden entirely when the browser can't do push or the deployment has no
// VAPID keys — an inert toggle is worse than no toggle.

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(Array.from(raw, c => c.charCodeAt(0)))
}

export default function PushToggle() {
  const [supported, setSupported] = useState(false)
  const [available, setAvailable] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window,
    )
    fetch('/api/push')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d) { setEnabled(!!d.enabled); setAvailable(!!d.available); setPublicKey(d.publicKey) }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  async function enable() {
    setBusy(true); setNote(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        // Browsers only ask once; after a block the user has to undo it in
        // site settings, so say that rather than silently failing.
        setNote(permission === 'denied'
          ? 'Notifications are blocked for this site — allow them in your browser settings, then try again.'
          : 'Notification permission was dismissed.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey!),
      })
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) { setNote('Could not save the subscription. Try again.'); return }
      setEnabled(true)
    } catch (err: any) {
      setNote(err?.message ?? 'Could not enable alerts.')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true); setNote(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await fetch(`/api/push${sub ? `?endpoint=${encodeURIComponent(sub.endpoint)}` : ''}`, { method: 'DELETE' })
      setEnabled(false)
    } finally {
      setBusy(false)
    }
  }

  if (!loaded || !supported || !available || !publicKey) return null

  return (
    <div className="mb-6 rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Buy-in zone alerts
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Every card names a zone to watch. Turn this on and we&apos;ll watch it for you — a
            notification when something you hold reaches its zone. Nothing else.
          </p>
        </div>
        <button onClick={enabled ? disable : enable} disabled={busy}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
          style={{
            background: enabled ? 'var(--bg-secondary)' : 'var(--accent-dim)',
            border: `1px solid ${enabled ? 'var(--border)' : 'rgba(0,229,160,0.3)'}`,
            color: enabled ? 'var(--text-muted)' : 'var(--accent)',
            cursor: busy ? 'default' : 'pointer',
          }}>
          {busy ? 'Working…' : enabled ? 'Turn off' : 'Turn on alerts'}
        </button>
      </div>
      {note && <p className="text-xs mt-2" style={{ color: 'var(--red)' }}>{note}</p>}
      {enabled && !note && (
        <p className="text-xs mt-2" style={{ color: 'var(--accent)' }}>
          On. You&apos;ll only hear from us about assets in your positions.
        </p>
      )}
    </div>
  )
}
