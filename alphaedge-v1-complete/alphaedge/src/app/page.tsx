import { redirect } from 'next/navigation'
import { createSupabaseContext } from '@/lib/supabase/context'

export default async function HomePage() {
  const { data: ctx } = await createSupabaseContext({ auth: ['user', 'none'] })
  redirect(ctx?.authMode === 'user' ? '/dashboard' : '/auth')
}
