'use client'

import { createBrowserClient } from '@supabase/ssr'

export type Database = any // Simplified; generate full types with `supabase gen types` if desired

// Browser client for use inside 'use client' components.
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
