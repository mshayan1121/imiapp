'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { z } from 'zod'

const createUserSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function createTeacher(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata.role !== 'admin') {
      return { error: 'Not authorized' }
    }

    const supabaseAdmin = createAdminClient()

    const data = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const validated = createUserSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Invalid user data: ' + validated.error.issues[0].message }
    }

    // Create user using service role key (admin client)
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: 'teacher',
        full_name: data.fullName,
      },
    })

    if (createError) {
      console.error('Auth Error:', createError)
      return { error: 'Failed to create teacher account. ' + createError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function createAdmin(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata.role !== 'admin') {
      return { error: 'Not authorized' }
    }

    const supabaseAdmin = createAdminClient()

    const data = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const validated = createUserSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Invalid user data: ' + validated.error.issues[0].message }
    }

    // Create user using service role key (admin client)
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: data.fullName,
      },
    })

    if (createError) {
      console.error('Auth Error:', createError)
      return { error: 'Failed to create admin account. ' + createError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteUser(userId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata.role !== 'admin') {
      return { error: 'Not authorized' }
    }

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Auth Error:', error)
      return { error: 'Failed to delete user account. ' + error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function bulkDeleteUsers(userIds: string[]) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata.role !== 'admin') {
      return { error: 'Not authorized' }
    }

    const supabaseAdmin = createAdminClient()

    // Delete users one by one since Supabase admin API doesn't support bulk delete
    const errors: string[] = []
    for (const userId of userIds) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) {
        errors.push(error.message)
      }
    }

    if (errors.length > 0) {
      console.error('Bulk Delete Errors:', errors)
      return { error: `Failed to delete ${errors.length} of ${userIds.length} users. ` + errors[0] }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
