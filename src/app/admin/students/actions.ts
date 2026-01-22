'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { studentSchema, uuidSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'

export async function createStudent(formData: FormData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || user.user_metadata.role !== 'admin') {
      return { error: 'Not authorized' }
    }

    const data = {
      name: formData.get('name') as string,
      year_group: formData.get('yearGroup') as string,
      school: formData.get('school') as string,
      created_by: user.id,
    }

    const validated = studentSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Invalid student data provided.' }
    }

    const { error } = await supabase.from('students').insert(data)

    if (error) {
      logger.error('Database Error:', error)
      return { error: 'Failed to create student. Please try again later.' }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/students/directory')
    return { success: true }
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateStudent(id: string, formData: FormData) {
  try {
    // Validate UUID
    if (!uuidSchema.safeParse(id).success) {
      return { error: 'Invalid student ID' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata.role !== 'admin') {
      return { error: 'Not authorized' }
    }

    const data = {
      name: formData.get('name') as string,
      year_group: formData.get('yearGroup') as string,
      school: formData.get('school') as string,
    }

    const validated = studentSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Invalid student data provided.' }
    }

    const { error } = await supabase.from('students').update(data).eq('id', id)

    if (error) {
      logger.error('Database Error:', error)
      return { error: 'Failed to update student. Please try again later.' }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/students/directory')
    return { success: true }
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteStudent(id: string) {
  try {
    // Validate UUID
    if (!uuidSchema.safeParse(id).success) {
      return { error: 'Invalid student ID' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata.role !== 'admin') {
      return { error: 'Not authorized' }
    }

    const { error } = await supabase.from('students').delete().eq('id', id)

    if (error) {
      logger.error('Database Error:', error)
      return { error: 'Failed to delete student: ' + error.message }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/students/directory')
    return { success: true }
  } catch (error) {
    logger.error('Server Error:', error)
    return { error: 'Internal Server Error' }
  }
}

export async function bulkDeleteStudents(ids: string[]) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata.role !== 'admin') {
      return { error: 'Not authorized' }
    }

    // Validate all UUIDs
    const validIds = ids.filter(id => uuidSchema.safeParse(id).success)
    if (validIds.length === 0) {
      return { error: 'No valid student IDs provided' }
    }

    const { error } = await supabase.from('students').delete().in('id', validIds)

    if (error) {
      logger.error('Database Error:', error)
      return { error: 'Failed to delete students: ' + error.message }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/students/directory')
    return { success: true }
  } catch (error) {
    logger.error('Server Error:', error)
    return { error: 'Internal Server Error' }
  }
}
