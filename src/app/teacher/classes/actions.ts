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
  
  return (data || []).map((item: any) => ({
    ...item,
    student: Array.isArray(item.student) ? item.student[0] : item.student,
    course: item.course ? {
      ... (Array.isArray(item.course) ? item.course[0] : item.course),
      qualification: Array.isArray((Array.isArray(item.course) ? item.course[0] : item.course).qualification) 
        ? (Array.isArray(item.course) ? item.course[0] : item.course).qualification[0] 
        : (Array.isArray(item.course) ? item.course[0] : item.course).qualification,
      board: Array.isArray((Array.isArray(item.course) ? item.course[0] : item.course).board)
        ? (Array.isArray(item.course) ? item.course[0] : item.course).board[0]
        : (Array.isArray(item.course) ? item.course[0] : item.course).board,
      subject: Array.isArray((Array.isArray(item.course) ? item.course[0] : item.course).subject)
        ? (Array.isArray(item.course) ? item.course[0] : item.course).subject[0]
        : (Array.isArray(item.course) ? item.course[0] : item.course).subject,
    } : null
  }))
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
