import 'server-only'

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secretKey) {
    throw new Error('Set SUPABASE_SECRET_KEY in .env.local to manage system users.')
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
