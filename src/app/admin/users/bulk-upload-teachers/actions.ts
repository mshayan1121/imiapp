'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Initialize admin client for user management
// This requires SUPABASE_SERVICE_ROLE_KEY to be set in environment variables
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function checkExistingEmails(emails: string[]) {
  const supabase = await createClient()
  
  // We assume emails are stored in lowercase in the database
  // If not, this check might miss some case-variant duplicates
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .in('email', emails)

  if (error) {
    console.error('Error checking existing emails:', error)
    // If the error is due to the table not existing or permission issues, 
    // we should return an empty array instead of crashing the whole process
    // But for critical errors, we log and return empty to fail open or throw?
    // Let's return empty array to avoid crash, but log error.
    return []
  }

  return data.map(u => u.email)
}

export async function importTeacher(teacher: {
  email: string
  fullName: string
  password: string
}) {
  const supabase = await createClient()
  
  try {
    // 1. Create Auth User using Admin API
    // We auto-confirm the email so they can login immediately
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: teacher.email,
      password: teacher.password,
      email_confirm: true,
      user_metadata: {
        full_name: teacher.fullName,
        role: 'teacher'
      }
    })

    if (authError) {
      console.error(`Auth creation failed for ${teacher.email}:`, authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'User creation failed (no data returned)' }
    }

    // 2. Create Database Record (users table)
    // We manually insert into the public.users table to ensure the record exists
    // and has the correct role.
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: teacher.email,
        full_name: teacher.fullName,
        role: 'teacher',
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error(`DB insert failed for ${teacher.email}:`, dbError)
      
      // Cleanup: Delete the auth user if DB insert fails to maintain consistency
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return { success: false, error: `Database error: ${dbError.message}` }
    }

    return { success: true }
  } catch (error: any) {
    console.error(`Unexpected error importing ${teacher.email}:`, error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

export async function logImport(data: {
  fileName: string
  totalRows: number
  successCount: number
  failedCount: number
  results: any
}) {
  const supabase = await createClient()
  
  // Get current user for 'uploaded_by' field
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  const { error } = await supabase.from('import_logs').insert({
    import_type: 'teachers',
    file_name: data.fileName,
    uploaded_by: user.id,
    total_rows: data.totalRows,
    success_count: data.successCount,
    failed_count: data.failedCount,
    log_data: data.results
  })

  if (error) {
    console.error('Failed to log import:', error)
  }
}
