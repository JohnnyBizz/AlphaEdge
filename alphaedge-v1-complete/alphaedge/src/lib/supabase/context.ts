import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  verifyCredentials,
  createContextClient,
  createAdminClient,
} from '@supabase/server/core'
import type { AuthModeWithKey, SupabaseContext } from '@supabase/server'

export type Database = any // Simplified; generate full types with `supabase gen types` if desired

/**
 * Builds an RLS-scoped Supabase context (+ an admin client) for Server
 * Components and Route Handlers, verifying the session cookie's JWT against
 * SUPABASE_JWKS_URL. Requires `middleware.ts` to be refreshing the session
 * cookie — otherwise expired tokens will fail verification here.
 */
export async function createSupabaseContext(
  options: { auth?: AuthModeWithKey | AuthModeWithKey[] } = { auth: 'user' }
): Promise<
  { data: SupabaseContext<Database>; error: null } | { data: null; error: Error }
> {
  const cookieStore = await cookies()

  const ssrClient = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components can't write cookies — middleware handles refresh.
          }
        },
      },
    }
  )

  const {
    data: { session },
  } = await ssrClient.auth.getSession()

  const { data: auth, error } = await verifyCredentials(
    { token: session?.access_token ?? null, apikey: null },
    { auth: options.auth ?? 'user' }
  )
  if (error) return { data: null, error }

  const supabase = createContextClient<Database>({ auth: { token: auth.token } })
  const supabaseAdmin = createAdminClient<Database>()

  return {
    data: {
      supabase,
      supabaseAdmin,
      userClaims: auth.userClaims,
      jwtClaims: auth.jwtClaims,
      authMode: auth.authMode,
    },
    error: null,
  }
}
