'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { termSchema } from '@/lib/schemas'
import { z } from 'zod'

export type TermFormData = z.infer<typeof termSchema>

export async function createTerm(data: TermFormData) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const validated = termSchema.safeParse(data)
    if (!validated.success) return { error: 'Invalid data: ' + validated.error.issues[0].message }

    const { error } = await supabase.from('terms').insert({
      ...validated.data,
      created_by: user.id,
      is_active: false, // Default to inactive
    })

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to create term: ' + error.message }
    }

    revalidatePath('/admin/terms')
    return { success: true }
  } catch (error) {
    console.error('Server Error:', error)
    return { error: 'Internal Server Error' }
  }
}

export async function updateTerm(id: string, data: TermFormData) {
  try {
    const supabase = await createClient()
    const validated = termSchema.safeParse(data)
    if (!validated.success) return { error: 'Invalid data: ' + validated.error.issues[0].message }

    const { error } = await supabase.from('terms').update(validated.data).eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to update term: ' + error.message }
    }

    revalidatePath('/admin/terms')
    return { success: true }
  } catch (error) {
    console.error('Server Error:', error)
    return { error: 'Internal Server Error' }
  }
}

export async function setActiveTerm(id: string) {
  const supabase = await createClient()

  // The trigger will handle deactivating others
  const { error } = await supabase.from('terms').update({ is_active: true }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/terms')
  return { success: true }
}

export async function deleteTerm(id: string) {
  const supabase = await createClient()

  // Check if active
  const { data: term } = await supabase.from('terms').select('is_active').eq('id', id).single()
  if (term?.is_active) return { error: 'Cannot delete active term' }

  const { error } = await supabase.from('terms').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/terms')
  return { success: true }
}
