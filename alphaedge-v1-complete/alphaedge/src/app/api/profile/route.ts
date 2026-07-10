import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseContext } from '@/lib/supabase/context'

export async function POST(req: NextRequest) {
  try {
    // Verify the request comes from a logged-in user
    const { data: ctx, error: authError } = await createSupabaseContext()
    if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { trade_style, profit_target, risk_tolerance } = await req.json()
    if (!trade_style || !profit_target || !risk_tolerance) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await ctx.supabaseAdmin.from('trader_profiles').upsert({
      user_id: ctx.userClaims!.id,
      trade_style,
      profit_target,
      risk_tolerance,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Profile save error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  const { data: ctx, error: authError } = await createSupabaseContext()
  if (authError || !ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await ctx.supabaseAdmin
    .from('trader_profiles')
    .select('*')
    .eq('user_id', ctx.userClaims!.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data ?? null })
}
