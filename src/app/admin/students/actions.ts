'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { studentSchema } from '@/lib/schemas'

export async function createStudent(formData: FormData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be logged in to create a student.' }

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
      console.error('Database Error:', error)
      return { error: 'Failed to create student. Please try again later.' }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/students/directory')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateStudent(id: string, formData: FormData) {
  try {
    const supabase = await createClient()

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
      console.error('Database Error:', error)
      return { error: 'Failed to update student. Please try again later.' }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/students/directory')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteStudent(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('students').delete().eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to delete student: ' + error.message }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/students/directory')
    return { success: true }
  } catch (error) {
    console.error('Server Error:', error)
    return { error: 'Internal Server Error' }
  }
}

export async function bulkDeleteStudents(ids: string[]) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('students').delete().in('id', ids)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to delete students: ' + error.message }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/students/directory')
    return { success: true }
  } catch (error) {
    console.error('Server Error:', error)
    return { error: 'Internal Server Error' }
  }
}
