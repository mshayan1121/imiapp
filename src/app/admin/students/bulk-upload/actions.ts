'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function checkExistingStudents(names: string[]) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('students')
    .select('name')
    .in('name', names)

  if (error) {
    console.error('Error checking existing students:', error)
    return []
  }

  return data.map(s => s.name)
}

export async function importStudent(student: {
  fullName: string
  yearGroup: string
  school: string
  email: string
  phone: string
  guardianName: string
}) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // 1. Create Student record
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert({
        name: student.fullName,
        year_group: student.yearGroup || 'Year 7', 
        school: student.school || 'Unknown',    
        created_by: user.id
      })
      .select()
      .single()

    if (studentError) {
      console.error(`Student creation failed for ${student.fullName}:`, studentError)
      return { success: false, error: studentError.message }
    }

    // 2. Create Contact record
    const { error: contactError } = await supabase
      .from('student_contacts')
      .insert({
        student_id: studentData.id,
        parent_name: student.guardianName || 'Unknown',
        relationship: 'Guardian',
        email: student.email,
        phone: student.phone
      })

    if (contactError) {
      console.error(`Contact creation failed for ${student.fullName}:`, contactError)
      // We might want to delete the student record if contact fails, 
      // but for bulk upload maybe just log it.
      return { success: false, error: contactError.message }
    }

    revalidatePath('/admin/students/directory')
    return { success: true }
  } catch (error: any) {
    console.error(`Unexpected error importing ${student.fullName}:`, error)
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
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('import_logs').insert({
    import_type: 'students',
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

  revalidatePath('/admin/students/directory')
}
