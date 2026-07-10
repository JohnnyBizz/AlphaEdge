import { createAdminClient as createAdminClientCore } from '@supabase/server/core'
import type { Database } from './context'

// Service-role client (bypasses RLS) for cron jobs, webhooks, and other
// server-only code with no caller session to scope to.
export const createAdminClient = () => createAdminClientCore<Database>()
