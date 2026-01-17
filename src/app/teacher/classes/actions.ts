'use server'

import { createClient } from '@/utils/supabase/server'

export async function getClassStudents(classId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('class_students')
    .select(
      `
      *,
      student:students(*),
      course:courses(
        id,
        name,
        qualification:qualifications(name),
        board:boards(name),
        subject:subjects(id, name)
      )
    `,
    )
    .eq('class_id', classId)
    .order('enrolled_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getCourseTopics(subjectId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('topics')
    .select(
      `
      *,
      subtopics(*)
    `,
    )
    .eq('subject_id', subjectId)
    .order('name')

  if (error) throw error
  return data
}
