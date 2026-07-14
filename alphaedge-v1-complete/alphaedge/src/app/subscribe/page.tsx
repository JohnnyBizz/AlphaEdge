'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, LogOut } from 'lucide-react'

type Plan = 'weekly' | 'monthly'

// Landing spot for signed-in users without an active subscription —
// typically people who created an account but abandoned checkout.
export default function SubscribePage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [plan, setPlan] = useState<Plan>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user?.email) { router.push('/auth'); return }
      setUser({ id: data.user.id, email: data.user.email })
    })
  }, [supabase, router])

  async function startCheckout() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: user.id, email: user.email }),
      })
      const { url, error } = await res.json()
      if (url) { window.location.href = url; return }
      setError(error ?? 'Could not start checkout')
    } catch {
      setError('Could not start checkout')
    }
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
          </span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>AlphaEdge</span>
        </div>

        <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            One step left
          </h1>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Your account ({user.email}) is ready — pick a plan to start your 7-day free trial
            and unlock the dashboard.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {([
              { key: 'weekly', label: 'Weekly', price: '$9', period: '/week', badge: null },
              { key: 'monthly', label: 'Monthly', price: '$29', period: '/month', badge: 'Save 19%' },
            ] as const).map(p => (
              <button key={p.key} type="button" onClick={() => setPlan(p.key)}
                className="relative p-3 rounded-lg text-left transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${plan === p.key ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}>
                {p.badge && (
                  <span className="absolute -top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--accent)', color: '#0a0d12' }}>
                    {p.badge}
                  </span>
                )}
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{p.label}</div>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {p.price}
                  <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{p.period}</span>
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="text-sm px-3 py-2.5 rounded-lg mb-4" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <button onClick={startCheckout} disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold"
            style={{
              background: 'var(--accent)', color: '#0a0d12', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
            {loading ? 'Redirecting to checkout…' : 'Start free trial →'}
          </button>

          <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-muted)' }}>
            7-day free trial · Cancel anytime · Billed via Stripe
          </p>
        </div>

        <div className="text-center mt-4">
          <button onClick={signOut} className="text-xs inline-flex items-center gap-1"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
