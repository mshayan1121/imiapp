'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { uuidSchema } from '@/lib/schemas'

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
      logger.error('Auth Error:', createError)
      return { error: 'Failed to create teacher account. ' + createError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    logger.error('Unexpected Error:', err)
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
      logger.error('Auth Error:', createError)
      return { error: 'Failed to create admin account. ' + createError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteUser(userId: string) {
  try {
    // Validate UUID
    if (!uuidSchema.safeParse(userId).success) {
      return { error: 'Invalid user ID' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata.role !== 'admin') {
      return { error: 'Not authorized' }
    }

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      logger.error('Auth Error:', error)
      return { error: 'Failed to delete user account. ' + error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    logger.error('Unexpected Error:', err)
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

    // Validate all UUIDs
    const validUserIds = userIds.filter(id => uuidSchema.safeParse(id).success)
    if (validUserIds.length === 0) {
      return { error: 'No valid user IDs provided' }
    }

    const supabaseAdmin = createAdminClient()

    // Delete users one by one since Supabase admin API doesn't support bulk delete
    const errors: string[] = []
    for (const userId of validUserIds) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) {
        errors.push(error.message)
      }
    }

    if (errors.length > 0) {
      logger.error('Bulk Delete Errors:', errors)
      return { error: `Failed to delete ${errors.length} of ${validUserIds.length} users. ` + errors[0] }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
