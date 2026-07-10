'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Eye, EyeOff, Zap, BarChart2, Clock } from 'lucide-react'

type Tab = 'signin' | 'signup'
type Plan = 'weekly' | 'monthly'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('signin')
  const [plan, setPlan] = useState<Plan>('weekly')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [notice, setNotice] = useState<string | null>(null)

  async function handleForgotPassword() {
    setError(null)
    setNotice(null)
    if (!email) {
      setError('Enter your email above first, then click "Forgot password?".')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setNotice(`Password reset link sent to ${email} — check your inbox.`)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Sign up failed')
      setLoading(false)
      return
    }

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, userId: data.user.id, email }),
    })

    const { url, error: stripeError } = await res.json()
    if (stripeError) {
      setError(stripeError)
      setLoading(false)
      return
    }

    window.location.href = url
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] p-12"
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-dim)' }}>
            <TrendingUp size={16} color="var(--accent)" />
          </div>
          <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>AlphaEdge</span>
        </div>

        <div>
          <div className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Market analysis,<br />
            <span style={{ color: 'var(--accent)' }}>decoded.</span>
          </div>
          <p className="text-base mb-10" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Educational AI analysis of stocks and crypto. Technical indicators, trend data, and clear
            explanations — all in one dashboard.
          </p>

          <div className="flex flex-col gap-5">
            {[
              { icon: Zap, title: 'Fresh analysis every hour', desc: 'AI re-analyzes all tracked assets continuously' },
              { icon: BarChart2, title: 'RSI, MACD, volume & more', desc: 'The key technical indicators, explained in plain English' },
              { icon: Clock, title: '7-day free trial', desc: 'Full access, cancel anytime, no questions asked' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0"
                  style={{ background: 'var(--accent-dim)' }}>
                  <Icon size={14} color="var(--accent)" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <p className="mb-2">
            For informational and educational purposes only. Not financial advice. Trading involves
            substantial risk of loss.
          </p>
          <p>
            <Link href="/terms" style={{ color: 'var(--text-secondary)' }}>Terms</Link>
            {' · '}
            <Link href="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy</Link>
            {' · '}
            <Link href="/disclaimer" style={{ color: 'var(--text-secondary)' }}>Disclaimer</Link>
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent-dim)' }}>
              <TrendingUp size={14} color="var(--accent)" />
            </div>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>AlphaEdge</span>
          </div>

          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
            {tab === 'signin' ? 'Sign in to access your dashboard.' : 'Start your 7-day free trial today.'}
          </p>

          <div className="flex gap-0 mb-6 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            {(['signin', 'signup'] as Tab[]).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(null) }}
                className="flex-1 py-2 text-sm rounded-md transition-all"
                style={{
                  background: tab === t ? 'var(--bg-card)' : 'transparent',
                  color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', fontWeight: tab === t ? 500 : 400,
                }}>
                {t === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp} className="flex flex-col gap-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Full name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Alex Johnson" required
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }} />
              </div>
            )}

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }} />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={8}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none pr-10"
                  style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {tab === 'signin' && (
                <div className="text-right mt-1.5">
                  <button type="button" onClick={handleForgotPassword} disabled={loading}
                    className="text-xs"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {tab === 'signup' && (
              <div>
                <label className="block text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Choose your plan</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'weekly', label: 'Weekly', price: '$9', period: '/week', badge: null },
                    { key: 'monthly', label: 'Monthly', price: '$29', period: '/month', badge: 'Save 19%' },
                  ] as const).map(p => (
                    <button key={p.key} type="button" onClick={() => setPlan(p.key)}
                      className="relative p-3 rounded-lg text-left transition-all"
                      style={{
                        background: plan === p.key ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                        border: `1px solid ${plan === p.key ? 'var(--accent)' : 'var(--border)'}`,
                        cursor: 'pointer',
                      }}>
                      {p.badge && (
                        <span className="absolute -top-2 right-2 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--accent)', color: '#0a0d12', fontWeight: 600, fontSize: 10 }}>
                          {p.badge}
                        </span>
                      )}
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{p.label}</div>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {p.price}<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{p.period}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  7-day free trial · Cancel anytime · Billed via Stripe
                </p>
              </div>
            )}

            {error && (
              <div className="text-sm px-3 py-2.5 rounded-lg" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
                {error}
              </div>
            )}

            {notice && (
              <div className="text-sm px-3 py-2.5 rounded-lg" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                {notice}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold mt-1 transition-opacity"
              style={{
                background: 'var(--accent)', color: '#0a0d12',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}>
              {loading ? 'Please wait...' : tab === 'signin' ? 'Sign in →' : 'Start free trial →'}
            </button>

            {tab === 'signup' && (
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                By signing up you agree to our{' '}
                <Link href="/terms" style={{ color: 'var(--accent)' }}>Terms of Service</Link>,{' '}
                <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>, and{' '}
                <Link href="/disclaimer" style={{ color: 'var(--accent)' }}>Disclaimer</Link>.
              </p>
            )}
          </form>

          <p className="text-xs text-center mt-5" style={{ color: 'var(--text-muted)' }}>
            {tab === 'signin'
              ? <>No account? <button onClick={() => setTab('signup')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Sign up free</button></>
              : <>Have an account? <button onClick={() => setTab('signin')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Sign in</button></>
            }
          </p>
        </div>
      </div>
    </div>
  )
}
