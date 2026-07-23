import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Service-role client — RLS'i bypass eder. SADECE token bazlı doğrulanmış
 * (auth gerektirmeyen) public sayfalarda kullanılmalı, her sorguda token/id
 * filtresi mutlaka olmalı. Asla client tarafına expose edilmemeli.
 */
export function createServiceRoleClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
