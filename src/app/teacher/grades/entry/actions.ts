'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { gradeArraySchema } from '@/lib/schemas'

export async function getTeacherData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // Get classes for this teacher
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id)

  if (classesError) throw classesError

  return { classes }
}

export async function getClassDetails(classId: string) {
  const supabase = await createClient()

  // Get students in this class with their courses
  const { data: students, error: studentsError } = await supabase
    .from('class_students')
    .select(
      `
      student_id,
      course_id,
      students (id, name, year_group),
      courses (id, name, subject_id)
    `,
    )
    .eq('class_id', classId)

  if (studentsError) throw studentsError

  const normalizedStudents = (students || []).map((s: any) => ({
    ...s,
    students: Array.isArray(s.students) ? s.students[0] : s.students,
    courses: Array.isArray(s.courses) ? s.courses[0] : s.courses,
  }))

  return { students: normalizedStudents }
}

export async function getCourseContent(courseId: string) {
  const supabase = await createClient()

  // Get subject_id from course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('subject_id')
    .eq('id', courseId)
    .single()

  if (courseError) throw courseError

  // Get topics for this subject
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('id, name')
    .eq('subject_id', course?.subject_id)

  if (topicsError) throw topicsError

  return { topics }
}

export async function getSubtopics(topicId: string) {
  const supabase = await createClient()

  const { data: subtopics, error: subtopicsError } = await supabase
    .from('subtopics')
    .select('id, name')
    .eq('topic_id', topicId)

  if (subtopicsError) throw subtopicsError

  return { subtopics }
}

export async function getActiveTerm() {
  const supabase = await createClient()

  const { data: term, error: termError } = await supabase
    .from('terms')
    .select('id, name')
    .eq('is_active', true)
    .single()

  if (termError) {
    // If no active term found, get the latest one
    const { data: latestTerm, error: latestError } = await supabase
      .from('terms')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (latestError) return null
    return latestTerm
  }

  return term
}

export async function checkExistingGrades(params: {
  student_id: string
  class_id: string
  course_id: string
  term_id: string
  topic_id: string
  subtopic_id: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('grades')
    .select('id, attempt_number')
    .match(params)
    .order('attempt_number', { ascending: false })

  if (error) return null
  return data
}

export async function submitGrades(grades: any[]) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'You must be logged in to submit grades.' }

    // Validate input
    const validationResult = gradeArraySchema.safeParse(grades)

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error)
      return { error: 'Invalid grade data: ' + validationResult.error.issues[0].message }
    }

    const validGrades = validationResult.data

    const gradesWithTeacher = validGrades.map((g) => ({
      ...g,
      entered_by: user.id,
    }))

    const { error } = await supabase.from('grades').insert(gradesWithTeacher)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to submit grades. Please try again.' }
    }

    revalidatePath('/teacher/grades/entry')
    revalidatePath('/teacher/grades')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteGrade(gradeId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('grades').delete().eq('id', gradeId)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to delete grade. Please try again.' }
    }

    revalidatePath('/teacher/grades/entry')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
