import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Client-side Supabase client (use in 'use client' components)
export const createBrowserClient = () => createClientComponentClient()

// Server-side Supabase client (use in server components & API routes)
export const createServerClient = () => createServerComponentClient({ cookies })

// Admin client (bypasses RLS — only use in server routes, NEVER in browser)
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
