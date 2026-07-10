'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp } from 'lucide-react'

type Status = 'checking' | 'ready' | 'invalid' | 'saving' | 'done'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<Status>('checking')
  const [error, setError] = useState<string | null>(null)

  // The recovery link signs the user in via the code in the URL; wait for
  // that session to appear before showing the form.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setStatus(s => (s === 'checking' || s === 'invalid' ? 'ready' : s))
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus(s => (s === 'checking' ? 'ready' : s))
      } else {
        setTimeout(() => setStatus(s => (s === 'checking' ? 'invalid' : s)), 3000)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setStatus('saving')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setStatus('ready')
      return
    }
    setStatus('done')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const inputStyle = {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  } as const

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
          </span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>AlphaEdge</span>
        </div>

        {status === 'checking' && (
          <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>Verifying your reset link…</p>
        )}

        {status === 'invalid' && (
          <div className="text-center">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              This reset link is invalid or has expired.
            </p>
            <Link href="/auth" className="text-sm" style={{ color: 'var(--accent)' }}>
              Back to sign in — request a new link there
            </Link>
          </div>
        )}

        {status === 'done' && (
          <p className="text-sm text-center" style={{ color: 'var(--accent)' }}>
            Password updated — taking you to your dashboard…
          </p>
        )}

        {(status === 'ready' || status === 'saving') && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Set a new password</h1>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={8}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Confirm new password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" required minLength={8}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>

            {error && (
              <div className="text-sm px-3 py-2.5 rounded-lg" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={status === 'saving'}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity"
              style={{
                background: 'var(--accent)', color: '#0a0d12', border: 'none',
                cursor: status === 'saving' ? 'not-allowed' : 'pointer',
                opacity: status === 'saving' ? 0.7 : 1,
              }}>
              {status === 'saving' ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
