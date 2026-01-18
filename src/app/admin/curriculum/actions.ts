'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const nameSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

// Qualifications
export async function createQualification(formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string

    const validated = nameSchema.safeParse({ name })
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase.from('qualifications').insert({ name })
    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to create qualification. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteQualification(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('qualifications').delete().eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to delete qualification. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateQualification(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string

    const validated = nameSchema.safeParse({ name })
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase.from('qualifications').update({ name }).eq('id', id)
    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to update qualification. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

// Boards
export async function createBoard(formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const qualificationId = formData.get('qualificationId') as string

    const validated = nameSchema.safeParse({ name })
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase
      .from('boards')
      .insert({ name, qualification_id: qualificationId })

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to create board. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteBoard(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('boards').delete().eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to delete board. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateBoard(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const qualificationId = formData.get('qualificationId') as string

    const validated = nameSchema.safeParse({ name })
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase
      .from('boards')
      .update({ name, qualification_id: qualificationId })
      .eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to update board. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

// Subjects
export async function createSubject(formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const boardId = formData.get('boardId') as string

    const validated = nameSchema.safeParse({ name })
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase.from('subjects').insert({ name, board_id: boardId })

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to create subject. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteSubject(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('subjects').delete().eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to delete subject. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateSubject(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const boardId = formData.get('boardId') as string

    const validated = nameSchema.safeParse({ name })
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase.from('subjects').update({ name, board_id: boardId }).eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to update subject. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

// Topics
export async function createTopic(formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const subjectId = formData.get('subjectId') as string

    const validated = nameSchema.safeParse({ name })
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase.from('topics').insert({ name, subject_id: subjectId })

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to create topic. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteTopic(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('topics').delete().eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to delete topic. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateTopic(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const subjectId = formData.get('subjectId') as string

    const validated = nameSchema.safeParse({ name })
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase.from('topics').update({ name, subject_id: subjectId }).eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to update topic. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

// Subtopics
export async function createSubtopic(formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const topicId = formData.get('topicId') as string

    const validated = nameSchema.safeParse({ name })
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase.from('subtopics').insert({ name, topic_id: topicId })

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to create subtopic. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteSubtopic(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('subtopics').delete().eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to delete subtopic. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateSubtopic(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const topicId = formData.get('topicId') as string

    const validated = nameSchema.safeParse({ name })
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase.from('subtopics').update({ name, topic_id: topicId }).eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to update subtopic. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

// Courses
export async function createCourse(formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const qualificationId = formData.get('qualificationId') as string
    const boardId = formData.get('boardId') as string
    const subjectId = formData.get('subjectId') as string

    const { error } = await supabase.from('courses').insert({
      name,
      qualification_id: qualificationId,
      board_id: boardId,
      subject_id: subjectId,
    })

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to create course. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteCourse(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('courses').delete().eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to delete course. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateCourse(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const qualificationId = formData.get('qualificationId') as string
    const boardId = formData.get('boardId') as string
    const subjectId = formData.get('subjectId') as string

    const { error } = await supabase
      .from('courses')
      .update({
        name,
        qualification_id: qualificationId,
        board_id: boardId,
        subject_id: subjectId,
      })
      .eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to update course. Please try again.' }
    }

    revalidatePath('/admin/curriculum')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
