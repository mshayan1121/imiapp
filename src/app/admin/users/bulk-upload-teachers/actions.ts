'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { logger } from '@/lib/logger'

/**
 * Check for existing emails in the database before bulk import
 */
export async function checkExistingEmails(emails: string[]) {
  const supabase = await createClient()
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata.role !== 'admin') {
    return []
  }
  
  // We assume emails are stored in lowercase in the database
  // If not, this check might miss some case-variant duplicates
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .in('email', emails)

  if (error) {
    logger.error('Error checking existing emails:', error)
    // If the error is due to the table not existing or permission issues, 
    // we should return an empty array instead of crashing the whole process
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
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata.role !== 'admin') {
    return { success: false, error: 'Not authorized' }
  }
  
  try {
    // Create admin client per-request for security
    const supabaseAdmin = createAdminClient()
    
    // Create Auth User using Admin API
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
      logger.error(`Auth creation failed for ${teacher.email}:`, authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'User creation failed (no data returned)' }
    }

    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Unexpected error importing ${teacher.email}:`, error)
    return { success: false, error: errorMessage }
  }
}

interface ImportLogData {
  fileName: string
  totalRows: number
  successCount: number
  failedCount: number
  results: Record<string, unknown>
}

export async function logImport(data: ImportLogData) {
  const supabase = await createClient()
  
  // Get current user for 'uploaded_by' field
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.user_metadata.role !== 'admin') return

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
    logger.error('Failed to log import:', error)
  }
}
