'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { gradeArraySchema, uuidSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'

/**
 * Helper to verify user is authenticated as a teacher
 */
async function checkTeacherAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  if (user.user_metadata.role !== 'teacher') throw new Error('Not authorized - teacher role required')
  return user
}

/**
 * Helper to verify teacher owns a specific class
 */
async function verifyClassOwnership(supabase: Awaited<ReturnType<typeof createClient>>, classId: string, teacherId: string) {
  const { data: classData, error } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', classId)
    .single()
  
  if (error || !classData) {
    throw new Error('Class not found')
  }
  
  if (classData.teacher_id !== teacherId) {
    throw new Error('Not authorized to access this class')
  }
}

export async function getTeacherData() {
  const supabase = await createClient()
  const user = await checkTeacherAuth(supabase)

  // Get classes for this teacher
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id)

  if (classesError) throw classesError

  return { classes }
}

export async function getClassDetails(classId: string) {
  // Validate UUID
  if (!uuidSchema.safeParse(classId).success) {
    throw new Error('Invalid class ID format')
  }

  const supabase = await createClient()
  const user = await checkTeacherAuth(supabase)
  
  // Verify teacher owns this class
  await verifyClassOwnership(supabase, classId, user.id)

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

  const normalizedStudents = (students || []).map((s: { student_id: string; course_id: string; students: unknown; courses: unknown }) => ({
    ...s,
    students: Array.isArray(s.students) ? s.students[0] : s.students,
    courses: Array.isArray(s.courses) ? s.courses[0] : s.courses,
  }))

  return { students: normalizedStudents }
}

export async function getCourseContent(courseId: string) {
  // Validate UUID
  if (!uuidSchema.safeParse(courseId).success) {
    throw new Error('Invalid course ID format')
  }

  const supabase = await createClient()
  await checkTeacherAuth(supabase)

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
  // Validate UUID
  if (!uuidSchema.safeParse(topicId).success) {
    throw new Error('Invalid topic ID format')
  }

  const supabase = await createClient()
  await checkTeacherAuth(supabase)

  const { data: subtopics, error: subtopicsError } = await supabase
    .from('subtopics')
    .select('id, name')
    .eq('topic_id', topicId)

  if (subtopicsError) throw subtopicsError

  return { subtopics }
}

export async function getActiveTerm() {
  const supabase = await createClient()
  await checkTeacherAuth(supabase)

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
  // Validate all UUID parameters
  const uuidFields = ['student_id', 'class_id', 'course_id', 'term_id', 'topic_id', 'subtopic_id'] as const
  for (const field of uuidFields) {
    if (!uuidSchema.safeParse(params[field]).success) {
      return null
    }
  }

  const supabase = await createClient()
  const user = await checkTeacherAuth(supabase)
  
  // Verify teacher owns this class
  await verifyClassOwnership(supabase, params.class_id, user.id)

  const { data, error } = await supabase
    .from('grades')
    .select('id, attempt_number')
    .match(params)
    .order('attempt_number', { ascending: false })

  if (error) return null
  return data
}

export async function submitGrades(grades: unknown[]) {
  try {
    const supabase = await createClient()
    const user = await checkTeacherAuth(supabase)

    // Validate input
    const validationResult = gradeArraySchema.safeParse(grades)

    if (!validationResult.success) {
      logger.error('Validation error:', validationResult.error)
      return { error: 'Invalid grade data: ' + validationResult.error.issues[0].message }
    }

    const validGrades = validationResult.data

    // Verify teacher owns all the classes in the grades
    const classIds = [...new Set(validGrades.map(g => g.class_id))]
    for (const classId of classIds) {
      await verifyClassOwnership(supabase, classId, user.id)
    }

    const gradesWithTeacher = validGrades.map((g) => ({
      ...g,
      entered_by: user.id,
    }))

    const { error } = await supabase.from('grades').insert(gradesWithTeacher)

    if (error) {
      logger.error('Database Error:', error)
      return { error: 'Failed to submit grades. Please try again.' }
    }

    revalidatePath('/teacher/grades/entry')
    revalidatePath('/teacher/grades')
    return { success: true }
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteGrade(gradeId: string) {
  try {
    // Validate UUID
    if (!uuidSchema.safeParse(gradeId).success) {
      return { error: 'Invalid grade ID format' }
    }

    const supabase = await createClient()
    const user = await checkTeacherAuth(supabase)
    
    // First verify the teacher owns the grade (via entered_by or class ownership)
    const { data: grade, error: fetchError } = await supabase
      .from('grades')
      .select('id, entered_by, class_id')
      .eq('id', gradeId)
      .single()

    if (fetchError || !grade) {
      return { error: 'Grade not found' }
    }

    // Verify authorization: either they entered the grade or they own the class
    if (grade.entered_by !== user.id) {
      try {
        await verifyClassOwnership(supabase, grade.class_id, user.id)
      } catch {
        return { error: 'Not authorized to delete this grade' }
      }
    }

    const { error } = await supabase.from('grades').delete().eq('id', gradeId)

    if (error) {
      logger.error('Database Error:', error)
      return { error: 'Failed to delete grade. Please try again.' }
    }

    revalidatePath('/teacher/grades/entry')
    revalidatePath('/teacher/grades')
    return { success: true }
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
