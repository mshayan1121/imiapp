'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Grade, GradeFiltersState } from '@/types/grades'

export async function getFiltersData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get terms
  const { data: terms } = await supabase
    .from('terms')
    .select('id, name, is_active')
    .order('start_date', { ascending: false })

  // Get classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id)

  return { terms, classes }
}

export async function getClassStudents(classId: string) {
  const supabase = await createClient()
  const { data: students } = await supabase
    .from('class_students')
    .select(
      `
      student_id,
      students (id, name)
    `,
    )
    .eq('class_id', classId)

  return students?.map((s: any) => {
    const student = Array.isArray(s.students) ? s.students[0] : s.students
    return student
  }) || []
}

export async function getGrades(
  filters: GradeFiltersState,
): Promise<{ data: Grade[]; count: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let query = supabase
    .from('grades')
    .select(
      `
      *,
      students (id, name),
      classes (id, name),
      courses (id, name, qualification_id, board_id, subject_id),
      topics (id, name),
      subtopics (id, name)
    `,
      { count: 'exact' },
    )
    .eq('entered_by', user.id)
    .order('assessed_date', { ascending: false })

  if (filters.class_id) query = query.eq('class_id', filters.class_id)
  if (filters.term_id) query = query.eq('term_id', filters.term_id)
  if (filters.student_id && filters.student_id !== 'all')
    query = query.eq('student_id', filters.student_id)
  if (filters.work_type && filters.work_type !== 'all')
    query = query.eq('work_type', filters.work_type)
  if (filters.topic_id) query = query.eq('topic_id', filters.topic_id)
  if (filters.subtopic_id) query = query.eq('subtopic_id', filters.subtopic_id)

  const page = filters.page || 1
  const limit = filters.limit || 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to)

  const { data: gradesData, count, error } = await query

  if (error) throw error
  
  const grades = (gradesData || []).map((g: any) => ({
    ...g,
    students: Array.isArray(g.students) ? g.students[0] : g.students,
    classes: Array.isArray(g.classes) ? g.classes[0] : g.classes,
    courses: Array.isArray(g.courses) ? g.courses[0] : g.courses,
    topics: Array.isArray(g.topics) ? g.topics[0] : g.topics,
    subtopics: Array.isArray(g.subtopics) ? g.subtopics[0] : g.subtopics,
  }))

  return { data: grades as Grade[], count: count || 0 }
}

export async function updateGrade(gradeId: string, updates: Partial<Grade>) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be logged in to update grades.' }

    const { data, error } = await supabase
      .from('grades')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gradeId)
      .eq('entered_by', user.id)
      .select()

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to update grade. Please try again.' }
    }

    revalidatePath('/teacher/grades')
    return { success: true, data }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteGrade(gradeId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be logged in to delete grades.' }

    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('id', gradeId)
      .eq('entered_by', user.id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to delete grade. Please try again.' }
    }

    revalidatePath('/teacher/grades')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function getGradeStats(termId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: grades } = await supabase
    .from('grades')
    .select('id, is_low_point, percentage')
    .eq('entered_by', user.id)
    .eq('term_id', termId)

  if (!grades) return { total: 0, lowPoints: 0, average: 0 }

  const total = grades.length
  const lowPoints = grades.filter((g) => g.is_low_point).length
  const average = total > 0 ? grades.reduce((acc, g) => acc + Number(g.percentage), 0) / total : 0

  return { total, lowPoints, average: Math.round(average * 10) / 10 }
}
