import { createClient } from '@supabase/supabase-js'

function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/**
 * Creates an admin Supabase client with service role privileges.
 * WARNING: This client bypasses RLS and should only be used in server-side code.
 * Never expose the service role key to the client.
 */
export function createAdminClient() {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')

  return createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
