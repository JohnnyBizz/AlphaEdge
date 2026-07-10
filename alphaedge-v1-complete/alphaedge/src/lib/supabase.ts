import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export type Database = any // Simplified; generate full types with `supabase gen types` if desired

// Client-side (components)
export const createBrowserClient = () => createClientComponentClient<Database>()

// Server-side (server components & API routes)
export const createServerClient = () => createServerComponentClient<Database>({ cookies })

// Admin (bypasses RLS — server/webhook only, never expose to browser)
export const createAdminClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
