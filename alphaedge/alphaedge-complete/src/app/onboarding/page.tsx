'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { TrendingUp, Zap, Clock, Target, Shield, Flame, ChevronRight, Check } from 'lucide-react'

type TradeStyle    = 'scalp' | 'swing' | 'position'
type ProfitTarget  = 'quick' | 'moderate' | 'home_run'
type RiskTolerance = 'conservative' | 'balanced' | 'aggressive'

interface Profile {
  trade_style:    TradeStyle    | null
  profit_target:  ProfitTarget  | null
  risk_tolerance: RiskTolerance | null
}

const STEPS = ['Trade style', 'Profit target', 'Risk tolerance']

/* ── Option card ─────────────────────────────────────── */
function OptionCard({
  selected, onClick, icon: Icon, color, title, subtitle, tag,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ElementType
  color: string
  title: string
  subtitle: string
  tag?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '16px 18px',
        borderRadius: 12, cursor: 'pointer',
        background: selected ? 'rgba(0,229,160,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? 'rgba(0,229,160,0.4)' : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      {/* icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: selected ? 'rgba(0,229,160,0.15)' : `${color}18`,
      }}>
        <Icon size={18} color={selected ? '#00e5a0' : color} />
      </div>

      {/* text */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: selected ? '#e8eaf0' : '#c0c8d8' }}>
            {title}
          </span>
          {tag && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
              background: 'rgba(250,180,30,0.15)', color: '#fab41e',
            }}>{tag}</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#4a5568', marginTop: 2 }}>{subtitle}</div>
      </div>

      {/* checkmark */}
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: selected ? '#00e5a0' : 'rgba(255,255,255,0.06)',
        border: selected ? 'none' : '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.15s',
      }}>
        {selected && <Check size={11} color="#0a0d12" strokeWidth={3} />}
      </div>
    </button>
  )
}

/* ── Step components ─────────────────────────────────── */
function StepTradeStyle({ value, onChange }: { value: TradeStyle | null; onChange: (v: TradeStyle) => void }) {
  const options: { key: TradeStyle; icon: React.ElementType; color: string; title: string; subtitle: string; tag?: string }[] = [
    { key: 'scalp',    icon: Zap,       color: '#fab41e', title: 'Scalp trader',    subtitle: 'In and out within minutes to hours. Fast signals, quick exits.',            tag: 'High activity' },
    { key: 'swing',    icon: TrendingUp, color: '#00e5a0', title: 'Swing trader',    subtitle: 'Hold positions for days to weeks. Balance of speed and patience.' },
    { key: 'position', icon: Clock,     color: '#7b7bff', title: 'Position trader',  subtitle: 'Think in months. Long setups, big targets, ride the macro trend.',         tag: 'Most popular' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map(o => (
        <OptionCard key={o.key} selected={value === o.key} onClick={() => onChange(o.key)}
          icon={o.icon} color={o.color} title={o.title} subtitle={o.subtitle} tag={o.tag} />
      ))}
    </div>
  )
}

function StepProfitTarget({ value, onChange }: { value: ProfitTarget | null; onChange: (v: ProfitTarget) => void }) {
  const options: { key: ProfitTarget; icon: React.ElementType; color: string; title: string; subtitle: string; tag?: string }[] = [
    { key: 'quick',     icon: Zap,    color: '#fab41e', title: 'Quick gains (2–5%)',     subtitle: 'Smaller, frequent wins. AI favors high-probability short-term momentum plays.' },
    { key: 'moderate',  icon: Target, color: '#00e5a0', title: 'Moderate gains (10–20%)', subtitle: 'Best of both worlds. Solid setups with real upside potential.',              tag: 'Recommended' },
    { key: 'home_run',  icon: Flame,  color: '#f04a4a', title: 'Home run (30%+)',          subtitle: 'Swing for the fences. AI prioritizes explosive setups with higher volatility.' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map(o => (
        <OptionCard key={o.key} selected={value === o.key} onClick={() => onChange(o.key)}
          icon={o.icon} color={o.color} title={o.title} subtitle={o.subtitle} tag={o.tag} />
      ))}
    </div>
  )
}

function StepRiskTolerance({ value, onChange }: { value: RiskTolerance | null; onChange: (v: RiskTolerance) => void }) {
  const options: { key: RiskTolerance; icon: React.ElementType; color: string; title: string; subtitle: string }[] = [
    { key: 'conservative', icon: Shield,    color: '#00e5a0', title: 'Conservative',  subtitle: 'Tight stop losses (2–3%). Only the cleanest setups. Capital preservation first.' },
    { key: 'balanced',     icon: Target,    color: '#7b7bff', title: 'Balanced',       subtitle: 'Standard stops (4–5%). Mix of safe and opportunistic plays.' },
    { key: 'aggressive',   icon: Flame,     color: '#f04a4a', title: 'Aggressive',     subtitle: 'Wider stops (6–10%). High-upside setups even with more noise. Risk on.' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map(o => (
        <OptionCard key={o.key} selected={value === o.key} onClick={() => onChange(o.key)}
          icon={o.icon} color={o.color} title={o.title} subtitle={o.subtitle} />
      ))}
    </div>
  )
}

/* ── Main page ───────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>({
    trade_style: null, profit_target: null, risk_tolerance: null,
  })

  const canAdvance = [
    !!profile.trade_style,
    !!profile.profit_target,
    !!profile.risk_tolerance,
  ][step]

  async function handleFinish() {
    setSaving(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, userId: user.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save profile')
      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  const headings = [
    { title: 'How do you like to trade?',           sub: 'This shapes the timeframe and speed of signals we surface for you.' },
    { title: 'What\'s your profit goal per trade?', sub: 'We\'ll tune the AI to prioritize setups that match your target return.' },
    { title: 'How do you handle risk?',             sub: 'This sets your stop-loss ranges and signal aggressiveness.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,229,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={14} color="#00e5a0" />
          </div>
          <span style={{ fontWeight: 600, color: '#e8eaf0' }}>AlphaEdge</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#4a5568' }}>Step {step + 1} of 3</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: '#00e5a0', borderRadius: 2,
            width: `${((step + 1) / 3) * 100}%`, transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Step pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              flex: 1, padding: '5px 0', textAlign: 'center', fontSize: 11, borderRadius: 6,
              background: i === step ? 'rgba(0,229,160,0.1)' : i < step ? 'rgba(0,229,160,0.05)' : 'rgba(255,255,255,0.03)',
              color: i === step ? '#00e5a0' : i < step ? 'rgba(0,229,160,0.5)' : '#4a5568',
              border: `1px solid ${i === step ? 'rgba(0,229,160,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              {i < step ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#e8eaf0', marginBottom: 6 }}>
            {headings[step].title}
          </h1>
          <p style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.6 }}>
            {headings[step].sub}
          </p>
        </div>

        {/* Step content */}
        {step === 0 && (
          <StepTradeStyle value={profile.trade_style} onChange={v => setProfile(p => ({ ...p, trade_style: v }))} />
        )}
        {step === 1 && (
          <StepProfitTarget value={profile.profit_target} onChange={v => setProfile(p => ({ ...p, profit_target: v }))} />
        )}
        {step === 2 && (
          <StepRiskTolerance value={profile.risk_tolerance} onChange={v => setProfile(p => ({ ...p, risk_tolerance: v }))} />
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(240,74,74,0.1)', color: '#f04a4a', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{
                padding: '12px 20px', borderRadius: 10, fontSize: 14, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#8892a4',
              }}>
              Back
            </button>
          )}
          <button
            disabled={!canAdvance || saving}
            onClick={step < 2 ? () => setStep(s => s + 1) : handleFinish}
            style={{
              flex: 1, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: canAdvance && !saving ? 'pointer' : 'not-allowed',
              background: canAdvance ? '#00e5a0' : 'rgba(255,255,255,0.06)',
              color: canAdvance ? '#0a0d12' : '#4a5568',
              border: 'none', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {saving ? 'Saving...' : step < 2 ? 'Continue' : 'Go to my signals'}
            {!saving && <ChevronRight size={16} />}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#4a5568' }}>
          You can update your profile anytime from settings
        </p>
      </div>
    </div>
  )
}
