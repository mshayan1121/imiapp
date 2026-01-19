'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const nameSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata.role !== 'admin') {
    throw new Error('Not authorized')
  }
  return supabase
}

// Qualifications
export async function createQualification(formData: FormData) {
  try {
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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
    const supabase = await checkAdmin()
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

// Bulk Upload Curriculum
export async function bulkUploadCurriculum(rows: Array<{
  qualification: string
  board: string
  subject: string
  topic: string
  subtopic: string
}>) {
  try {
    const supabase = await checkAdmin()
    
    const results = {
      qualifications: { created: 0, existing: 0 },
      boards: { created: 0, existing: 0 },
      subjects: { created: 0, existing: 0 },
      topics: { created: 0, existing: 0 },
      subtopics: { created: 0, existing: 0 },
      errors: [] as Array<{ row: number; error: string }>
    }

    // Map to store IDs for hierarchical relationships
    const qualMap = new Map<string, string>()
    const boardMap = new Map<string, string>()
    const subjectMap = new Map<string, string>()
    const topicMap = new Map<string, string>()

    // First, get all existing items
    const [qualData, boardData, subjectData, topicData] = await Promise.all([
      supabase.from('qualifications').select('id, name'),
      supabase.from('boards').select('id, name, qualification_id'),
      supabase.from('subjects').select('id, name, board_id'),
      supabase.from('topics').select('id, name, subject_id'),
    ])

    // Build maps for existing items
    qualData.data?.forEach(q => qualMap.set(q.name.toLowerCase(), q.id))
    
    boardData.data?.forEach(b => {
      const key = `${b.qualification_id}:${b.name.toLowerCase()}`
      boardMap.set(key, b.id)
    })
    
    subjectData.data?.forEach(s => {
      const key = `${s.board_id}:${s.name.toLowerCase()}`
      subjectMap.set(key, s.id)
    })
    
    topicData.data?.forEach(t => {
      const key = `${t.subject_id}:${t.name.toLowerCase()}`
      topicMap.set(key, t.id)
    })

    // Process Qualifications
    const uniqueQuals = [...new Set(rows.map(r => r.qualification.trim()))].filter(q => q)
    const newQuals = uniqueQuals.filter(q => !qualMap.has(q.toLowerCase()))
    
    if (newQuals.length > 0) {
      const { data, error } = await supabase
        .from('qualifications')
        .insert(newQuals.map(name => ({ name })))
        .select('id, name')
      
      if (error) throw new Error(`Bulk insert qualifications: ${error.message}`)
      
      data.forEach(q => qualMap.set(q.name.toLowerCase(), q.id))
      results.qualifications.created += data.length
    }
    results.qualifications.existing = rows.length - results.qualifications.created

    // Process Boards
    const uniqueBoards = new Map<string, { name: string, qualificationId: string }>()
    rows.forEach(row => {
      const qualId = qualMap.get(row.qualification.toLowerCase())
      if (qualId && row.board) {
        const key = `${qualId}:${row.board.toLowerCase()}`
        if (!boardMap.has(key)) {
          uniqueBoards.set(key, { 
            name: row.board.trim(), 
            qualificationId: qualId 
          })
        }
      }
    })

    if (uniqueBoards.size > 0) {
      const boardsToInsert = Array.from(uniqueBoards.values()).map(b => ({
        name: b.name,
        qualification_id: b.qualificationId
      }))

      const { data, error } = await supabase
        .from('boards')
        .insert(boardsToInsert)
        .select('id, name, qualification_id')

      if (error) throw new Error(`Bulk insert boards: ${error.message}`)

      data.forEach(b => {
        const key = `${b.qualification_id}:${b.name.toLowerCase()}`
        boardMap.set(key, b.id)
      })
      results.boards.created += data.length
    }
    results.boards.existing = rows.length - results.boards.created

    // Process Subjects
    const uniqueSubjects = new Map<string, { name: string, boardId: string }>()
    rows.forEach(row => {
      const qualId = qualMap.get(row.qualification.toLowerCase())
      if (qualId && row.board) {
        const boardKey = `${qualId}:${row.board.toLowerCase()}`
        const boardId = boardMap.get(boardKey)
        
        if (boardId && row.subject) {
          const key = `${boardId}:${row.subject.toLowerCase()}`
          if (!subjectMap.has(key)) {
            uniqueSubjects.set(key, { 
              name: row.subject.trim(), 
              boardId: boardId 
            })
          }
        }
      }
    })

    if (uniqueSubjects.size > 0) {
      const subjectsToInsert = Array.from(uniqueSubjects.values()).map(s => ({
        name: s.name,
        board_id: s.boardId
      }))

      const { data, error } = await supabase
        .from('subjects')
        .insert(subjectsToInsert)
        .select('id, name, board_id')

      if (error) throw new Error(`Bulk insert subjects: ${error.message}`)

      data.forEach(s => {
        const key = `${s.board_id}:${s.name.toLowerCase()}`
        subjectMap.set(key, s.id)
      })
      results.subjects.created += data.length
    }
    results.subjects.existing = rows.length - results.subjects.created

    // Process Topics
    const uniqueTopics = new Map<string, { name: string, subjectId: string }>()
    rows.forEach(row => {
      const qualId = qualMap.get(row.qualification.toLowerCase())
      if (qualId && row.board) {
        const boardKey = `${qualId}:${row.board.toLowerCase()}`
        const boardId = boardMap.get(boardKey)
        if (boardId && row.subject) {
          const subjectKey = `${boardId}:${row.subject.toLowerCase()}`
          const subjectId = subjectMap.get(subjectKey)
          
          if (subjectId && row.topic) {
            const key = `${subjectId}:${row.topic.toLowerCase()}`
            if (!topicMap.has(key)) {
              uniqueTopics.set(key, { 
                name: row.topic.trim(), 
                subjectId: subjectId 
              })
            }
          }
        }
      }
    })

    if (uniqueTopics.size > 0) {
      const topicsToInsert = Array.from(uniqueTopics.values()).map(t => ({
        name: t.name,
        subject_id: t.subjectId
      }))

      const { data, error } = await supabase
        .from('topics')
        .insert(topicsToInsert)
        .select('id, name, subject_id')

      if (error) throw new Error(`Bulk insert topics: ${error.message}`)

      data.forEach(t => {
        const key = `${t.subject_id}:${t.name.toLowerCase()}`
        topicMap.set(key, t.id)
      })
      results.topics.created += data.length
    }
    results.topics.existing = rows.length - results.topics.created

    // Process Subtopics
    const uniqueSubtopics = new Map<string, { name: string, topicId: string }>()
    
    // We need to fetch existing subtopics first because we didn't fetch them at the start
    // to avoid fetching the entire subtopic table which could be huge.
    // Instead, let's fetch subtopics only for the topics we are touching.
    const relevantTopicIds = Array.from(topicMap.values())
    // Chunk topic IDs to avoid query too large error if necessary, but for now let's try direct
    // Actually, simpler to just fetch all subtopics for involved topics if we can.
    // Given the constraints and likely usage, let's just stick to the pattern:
    // Gather all potential subtopics, check if they exist in DB (batched), then insert new ones.
    
    // Improved strategy for Subtopics:
    // 1. Identify all (TopicID, SubtopicName) pairs from input
    // 2. Query DB for these pairs to see which exist
    // 3. Insert the ones that don't exist
    
    const potentialSubtopics = new Map<string, { name: string, topicId: string }>()
    
    rows.forEach(row => {
      // Resolve Topic ID path...
      const qualId = qualMap.get(row.qualification.toLowerCase())
      if (qualId) {
        const boardId = boardMap.get(`${qualId}:${row.board.toLowerCase()}`)
        if (boardId) {
          const subjectId = subjectMap.get(`${boardId}:${row.subject.toLowerCase()}`)
          if (subjectId) {
             const topicId = topicMap.get(`${subjectId}:${row.topic.toLowerCase()}`)
             if (topicId && row.subtopic) {
               const key = `${topicId}:${row.subtopic.toLowerCase()}`
               potentialSubtopics.set(key, { 
                 name: row.subtopic.trim(), 
                 topicId: topicId 
               })
             }
          }
        }
      }
    })

    if (potentialSubtopics.size > 0) {
      // Get all topic IDs involved
      const topicIds = Array.from(new Set(Array.from(potentialSubtopics.values()).map(s => s.topicId)))
      
      // Fetch existing subtopics for these topics
      const { data: existingSubtopics, error: fetchError } = await supabase
        .from('subtopics')
        .select('id, name, topic_id')
        .in('topic_id', topicIds)
      
      if (fetchError) throw new Error(`Fetch subtopics: ${fetchError.message}`)
      
      const existingSubtopicSet = new Set<string>()
      existingSubtopics?.forEach(st => {
        existingSubtopicSet.add(`${st.topic_id}:${st.name.toLowerCase()}`)
      })

      const subtopicsToInsert = Array.from(potentialSubtopics.entries())
        .filter(([key]) => !existingSubtopicSet.has(key))
        .map(([_, val]) => ({
          name: val.name,
          topic_id: val.topicId
        }))

      if (subtopicsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('subtopics')
          .insert(subtopicsToInsert)
        
        if (insertError) throw new Error(`Bulk insert subtopics: ${insertError.message}`)
        
        results.subtopics.created += subtopicsToInsert.length
      }
      results.subtopics.existing = rows.length - results.subtopics.created // Approximate
    }

    revalidatePath('/admin/curriculum')
    return { success: true, results }
  } catch (err: any) {
    console.error('Bulk upload error:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}