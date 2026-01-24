'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { uuidSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import type {
  GradebookData,
  GradebookRow,
  GradeEntry,
  SaveGradeInput,
  UpdateGradeInput,
  AddRetakeInput,
  GradebookStudent,
} from './types'

/**
 * Helper to verify user is authenticated as a teacher
 */
async function checkTeacherAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  if (user.user_metadata.role !== 'teacher') throw new Error('Not authorized - teacher role required')
  return user
}

/**
 * Helper to verify teacher owns a specific class
 */
async function verifyClassOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string,
  teacherId: string
) {
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

/**
 * Get teacher's classes
 */
export async function getTeacherClasses() {
  const supabase = await createClient()
  const user = await checkTeacherAuth(supabase)

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id)
    .order('name')

  if (error) throw error
  return classes || []
}

/**
 * Get students in a class
 */
export async function getClassStudents(classId: string): Promise<GradebookStudent[]> {
  if (!uuidSchema.safeParse(classId).success) {
    throw new Error('Invalid class ID format')
  }

  const supabase = await createClient()
  const user = await checkTeacherAuth(supabase)
  await verifyClassOwnership(supabase, classId, user.id)

  const { data: classStudents, error } = await supabase
    .from('class_students')
    .select(`
      student_id,
      students (id, name, year_group)
    `)
    .eq('class_id', classId)

  if (error) throw error

  const students: GradebookStudent[] = []
  ;(classStudents || []).forEach((cs: any) => {
    const student = Array.isArray(cs.students) ? cs.students[0] : cs.students
    if (student && !students.find((s) => s.id === student.id)) {
      students.push({
        id: student.id,
        name: student.name,
        yearGroup: student.year_group,
      })
    }
  })

  // Sort alphabetically
  students.sort((a, b) => a.name.localeCompare(b.name))
  return students
}

/**
 * Get all terms
 */
export async function getTerms() {
  const supabase = await createClient()
  await checkTeacherAuth(supabase)

  const { data: terms, error } = await supabase
    .from('terms')
    .select('id, name, is_active')
    .order('start_date', { ascending: false })

  if (error) throw error
  return terms || []
}

/**
 * Get active term
 */
export async function getActiveTerm() {
  const supabase = await createClient()
  await checkTeacherAuth(supabase)

  const { data: term, error } = await supabase
    .from('terms')
    .select('id, name')
    .eq('is_active', true)
    .single()

  if (error) {
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

/**
 * Main function to get gradebook data for a SINGLE student
 */
export async function getGradebookData(
  classId: string,
  studentId: string,
  termId: string,
  workTypeFilter?: string
): Promise<GradebookData | null> {
  // Validate UUIDs
  if (!uuidSchema.safeParse(classId).success) {
    throw new Error('Invalid class ID format')
  }
  if (!uuidSchema.safeParse(studentId).success) {
    throw new Error('Invalid student ID format')
  }
  if (!uuidSchema.safeParse(termId).success) {
    throw new Error('Invalid term ID format')
  }

  const supabase = await createClient()
  const user = await checkTeacherAuth(supabase)
  await verifyClassOwnership(supabase, classId, user.id)

  // Get class details
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .eq('id', classId)
    .single()

  if (classError) throw classError

  // Get student details
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('id, name')
    .eq('id', studentId)
    .single()

  if (studentError) throw studentError

  // Get course for this student in this class
  const { data: classStudentData, error: csError } = await supabase
    .from('class_students')
    .select(`
      course_id,
      courses (id, name, subject_id)
    `)
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .single()

  if (csError || !classStudentData) {
    return null
  }

  const course = Array.isArray(classStudentData.courses)
    ? classStudentData.courses[0]
    : classStudentData.courses

  if (!course) {
    return null
  }

  // Get topics for the subject
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select(`
      id,
      name,
      subtopics (id, name)
    `)
    .eq('subject_id', course.subject_id)
    .order('name')

  if (topicsError) throw topicsError

  // Build rows for topics and subtopics
  const rows: GradebookRow[] = []
  ;(topics || []).forEach((topic: any) => {
    const subtopics = topic.subtopics || []

    // Add topic row
    rows.push({
      id: `topic-${topic.id}`,
      rowType: 'topic',
      topicId: topic.id,
      subtopicId: null,
      name: topic.name,
      hasChildren: subtopics.length > 0,
      grade: null,
      allGrades: [],
    })

    // Add subtopic rows
    subtopics.forEach((subtopic: any) => {
      rows.push({
        id: `subtopic-${subtopic.id}`,
        rowType: 'subtopic',
        topicId: topic.id,
        subtopicId: subtopic.id,
        name: subtopic.name,
        hasChildren: false,
        parentTopicId: topic.id,
        grade: null,
        allGrades: [],
      })
    })
  })

  // Fetch ALL grades for this student in this class/term
  let gradesQuery = supabase
    .from('grades')
    .select('*')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .eq('term_id', termId)
    .order('assessed_date', { ascending: false })
    .order('attempt_number', { ascending: false })
    .order('created_at', { ascending: false })

  // Apply work type filter if provided
  if (workTypeFilter && workTypeFilter !== 'all') {
    if (workTypeFilter === 'classwork' || workTypeFilter === 'homework') {
      gradesQuery = gradesQuery.eq('work_type', workTypeFilter)
    } else if (workTypeFilter === 'worksheet' || workTypeFilter === 'pastpaper') {
      gradesQuery = gradesQuery.eq('work_subtype', workTypeFilter)
    }
  }

  const { data: grades, error: gradesError } = await gradesQuery

  if (gradesError) throw gradesError

  // Map grades to rows
  ;(grades || []).forEach((grade: any) => {
    let rowId: string
    if (grade.subtopic_id) {
      rowId = `subtopic-${grade.subtopic_id}`
    } else {
      rowId = `topic-${grade.topic_id}`
    }

    const row = rows.find((r) => r.id === rowId)
    if (row) {
      const gradeEntry: GradeEntry = {
        id: grade.id,
        marksObtained: grade.marks_obtained,
        totalMarks: grade.total_marks,
        percentage: grade.percentage,
        workType: grade.work_type,
        workSubtype: grade.work_subtype,
        assessedDate: grade.assessed_date,
        isLowPoint: grade.is_low_point,
        attemptNumber: grade.attempt_number || 1,
        isRetake: grade.is_retake || false,
        isReassigned: grade.is_reassigned || false,
        originalGradeId: grade.original_grade_id || null,
        homeworkSubmitted: grade.homework_submitted,
        notes: grade.notes,
        createdAt: grade.created_at,
      }

      row.allGrades.push(gradeEntry)

      // Set the latest (first in array since ordered desc) as the current grade
      if (!row.grade) {
        row.grade = gradeEntry
      }
    }
  })

  return {
    className: classData.name,
    courseName: course.name,
    courseId: course.id,
    studentName: studentData.name,
    rows,
  }
}

/**
 * Save a new grade or update existing
 */
export async function saveGrade(input: SaveGradeInput) {
  try {
    const supabase = await createClient()
    const user = await checkTeacherAuth(supabase)
    await verifyClassOwnership(supabase, input.classId, user.id)

    // Calculate percentage and low point flag
    const percentage = Math.round((input.marksObtained / input.totalMarks) * 100)
    const isLowPoint = percentage < 80

    // Check for existing grade to determine if update or insert
    let existingQuery = supabase
      .from('grades')
      .select('id, attempt_number')
      .eq('class_id', input.classId)
      .eq('student_id', input.studentId)
      .eq('term_id', input.termId)
      .eq('topic_id', input.topicId)

    if (input.subtopicId) {
      existingQuery = existingQuery.eq('subtopic_id', input.subtopicId)
    } else {
      existingQuery = existingQuery.is('subtopic_id', null)
    }

    const { data: existingGrades } = await existingQuery
      .eq('is_retake', false)
      .eq('is_reassigned', false)
      .order('attempt_number', { ascending: false })

    const gradeData: any = {
      student_id: input.studentId,
      class_id: input.classId,
      course_id: input.courseId,
      term_id: input.termId,
      topic_id: input.topicId,
      subtopic_id: input.subtopicId || null,
      work_type: input.workType,
      work_subtype: input.workSubtype,
      marks_obtained: input.marksObtained,
      total_marks: input.totalMarks,
      percentage,
      is_low_point: isLowPoint,
      assessed_date: input.assessedDate,
      notes: input.notes || null,
      entered_by: user.id,
    }

    // Add homework_submitted if it's homework
    if (input.workType === 'homework' && input.homeworkSubmitted !== undefined) {
      gradeData.homework_submitted = input.homeworkSubmitted
    }

    let result
    if (existingGrades && existingGrades.length > 0) {
      // Update existing grade
      const existingId = existingGrades[0].id
      const { data, error } = await supabase
        .from('grades')
        .update({
          ...gradeData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingId)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Insert new grade
      gradeData.attempt_number = 1
      const { data, error } = await supabase
        .from('grades')
        .insert(gradeData)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    revalidatePath('/teacher/grades/gradebook')
    revalidatePath('/teacher/grades')
    return { success: true, data: result }
  } catch (err) {
    logger.error('Save grade error:', err)
    return { error: 'Failed to save grade. Please try again.' }
  }
}

/**
 * Update an existing grade (for inline editing)
 */
export async function updateGrade(gradeId: string, input: UpdateGradeInput) {
  try {
    if (!uuidSchema.safeParse(gradeId).success) {
      return { error: 'Invalid grade ID format' }
    }

    const supabase = await createClient()
    const user = await checkTeacherAuth(supabase)

    // Get existing grade
    const { data: existingGrade, error: fetchError } = await supabase
      .from('grades')
      .select('id, class_id, entered_by, marks_obtained, total_marks')
      .eq('id', gradeId)
      .single()

    if (fetchError || !existingGrade) {
      return { error: 'Grade not found' }
    }

    // Verify authorization
    if (existingGrade.entered_by !== user.id) {
      try {
        await verifyClassOwnership(supabase, existingGrade.class_id, user.id)
      } catch {
        return { error: 'Not authorized to update this grade' }
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (input.marksObtained !== undefined) {
      updateData.marks_obtained = input.marksObtained
    }
    if (input.totalMarks !== undefined) {
      updateData.total_marks = input.totalMarks
    }
    if (input.workType !== undefined) {
      updateData.work_type = input.workType
    }
    if (input.workSubtype !== undefined) {
      updateData.work_subtype = input.workSubtype
    }
    if (input.assessedDate !== undefined) {
      updateData.assessed_date = input.assessedDate
    }
    if (input.homeworkSubmitted !== undefined) {
      updateData.homework_submitted = input.homeworkSubmitted
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes
    }

    // Recalculate percentage if marks changed
    const marks = input.marksObtained ?? existingGrade.marks_obtained
    const total = input.totalMarks ?? existingGrade.total_marks
    if (marks !== undefined && total !== undefined && total > 0) {
      updateData.percentage = Math.round((marks / total) * 100)
      updateData.is_low_point = updateData.percentage < 80
    }

    const { data, error } = await supabase
      .from('grades')
      .update(updateData)
      .eq('id', gradeId)
      .select()
      .single()

    if (error) {
      logger.error('Database Error:', error)
      return { error: 'Failed to update grade. Please try again.' }
    }

    revalidatePath('/teacher/grades/gradebook')
    revalidatePath('/teacher/grades')
    return { success: true, data }
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Reassign homework (mark original as reassigned, create new entry)
 */
export async function reassignHomework(
  gradeId: string,
  newDeadline: string,
  notes?: string
) {
  try {
    if (!uuidSchema.safeParse(gradeId).success) {
      return { error: 'Invalid grade ID format' }
    }

    const supabase = await createClient()
    const user = await checkTeacherAuth(supabase)

    // Get the original grade
    const { data: originalGrade, error: fetchError } = await supabase
      .from('grades')
      .select('*')
      .eq('id', gradeId)
      .single()

    if (fetchError || !originalGrade) {
      return { error: 'Grade not found' }
    }

    // Verify it's homework
    if (originalGrade.work_type !== 'homework') {
      return { error: 'Can only reassign homework' }
    }

    // Verify authorization
    await verifyClassOwnership(supabase, originalGrade.class_id, user.id)

    // Mark original as reassigned
    const { error: updateError } = await supabase
      .from('grades')
      .update({
        is_reassigned: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gradeId)

    if (updateError) {
      logger.error('Update error:', updateError)
      return { error: 'Failed to mark original homework as reassigned' }
    }

    // Create new homework entry (empty, ready for new grade)
    const newGrade = {
      student_id: originalGrade.student_id,
      class_id: originalGrade.class_id,
      course_id: originalGrade.course_id,
      term_id: originalGrade.term_id,
      topic_id: originalGrade.topic_id,
      subtopic_id: originalGrade.subtopic_id,
      work_type: 'homework',
      work_subtype: originalGrade.work_subtype,
      marks_obtained: 0,
      total_marks: originalGrade.total_marks,
      percentage: 0,
      is_low_point: true,
      attempt_number: (originalGrade.attempt_number || 1) + 1,
      assessed_date: newDeadline,
      original_grade_id: gradeId,
      is_retake: false,
      is_reassigned: false,
      homework_submitted: false,
      notes: notes || `Reassigned from ${originalGrade.assessed_date}`,
      entered_by: user.id,
    }

    const { data, error: insertError } = await supabase
      .from('grades')
      .insert(newGrade)
      .select()
      .single()

    if (insertError) {
      logger.error('Insert error:', insertError)
      return { error: 'Failed to create reassigned homework' }
    }

    revalidatePath('/teacher/grades/gradebook')
    revalidatePath('/teacher/grades')
    return { success: true, data }
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Add a retake for an existing grade
 */
export async function addRetake(input: AddRetakeInput) {
  try {
    if (!uuidSchema.safeParse(input.originalGradeId).success) {
      return { error: 'Invalid original grade ID format' }
    }

    const supabase = await createClient()
    const user = await checkTeacherAuth(supabase)

    // Get the original grade
    const { data: originalGrade, error: fetchError } = await supabase
      .from('grades')
      .select('*')
      .eq('id', input.originalGradeId)
      .single()

    if (fetchError || !originalGrade) {
      return { error: 'Original grade not found' }
    }

    // Verify authorization
    await verifyClassOwnership(supabase, input.classId, user.id)

    // Get max attempt number for this topic/subtopic
    let attemptQuery = supabase
      .from('grades')
      .select('attempt_number')
      .eq('class_id', input.classId)
      .eq('student_id', input.studentId)
      .eq('term_id', input.termId)
      .eq('topic_id', input.topicId)

    if (input.subtopicId) {
      attemptQuery = attemptQuery.eq('subtopic_id', input.subtopicId)
    } else {
      attemptQuery = attemptQuery.is('subtopic_id', null)
    }

    const { data: existingGrades } = await attemptQuery.order('attempt_number', { ascending: false })

    const maxAttempt = existingGrades && existingGrades.length > 0
      ? Math.max(...existingGrades.map((g: any) => g.attempt_number || 1))
      : 1

    // Calculate percentage
    const percentage = Math.round((input.marksObtained / input.totalMarks) * 100)
    const isLowPoint = percentage < 80

    const retakeGrade = {
      student_id: input.studentId,
      class_id: input.classId,
      course_id: input.courseId,
      term_id: input.termId,
      topic_id: input.topicId,
      subtopic_id: input.subtopicId || null,
      work_type: input.workType,
      work_subtype: input.workSubtype,
      marks_obtained: input.marksObtained,
      total_marks: input.totalMarks,
      percentage,
      is_low_point: isLowPoint,
      attempt_number: maxAttempt + 1,
      assessed_date: input.assessedDate,
      original_grade_id: input.originalGradeId,
      is_retake: true,
      is_reassigned: false,
      entered_by: user.id,
    }

    const { data, error: insertError } = await supabase
      .from('grades')
      .insert(retakeGrade)
      .select()
      .single()

    if (insertError) {
      logger.error('Insert error:', insertError)
      return { error: 'Failed to create retake' }
    }

    revalidatePath('/teacher/grades/gradebook')
    revalidatePath('/teacher/grades')
    return { success: true, data }
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Delete a grade
 */
export async function deleteGrade(gradeId: string) {
  try {
    if (!uuidSchema.safeParse(gradeId).success) {
      return { error: 'Invalid grade ID format' }
    }

    const supabase = await createClient()
    const user = await checkTeacherAuth(supabase)

    const { data: existingGrade, error: fetchError } = await supabase
      .from('grades')
      .select('id, class_id, entered_by')
      .eq('id', gradeId)
      .single()

    if (fetchError || !existingGrade) {
      return { error: 'Grade not found' }
    }

    if (existingGrade.entered_by !== user.id) {
      try {
        await verifyClassOwnership(supabase, existingGrade.class_id, user.id)
      } catch {
        return { error: 'Not authorized to delete this grade' }
      }
    }

    const { error } = await supabase.from('grades').delete().eq('id', gradeId)

    if (error) {
      logger.error('Database Error:', error)
      return { error: 'Failed to delete grade. Please try again.' }
    }

    revalidatePath('/teacher/grades/gradebook')
    revalidatePath('/teacher/grades')
    return { success: true }
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Get grade history for a specific topic/subtopic (for trend view)
 */
export async function getGradeHistory(
  classId: string,
  studentId: string,
  termId: string,
  topicId: string,
  subtopicId: string | null
) {
  const ids = [classId, studentId, termId, topicId]
  if (subtopicId) ids.push(subtopicId)

  for (const id of ids) {
    if (!uuidSchema.safeParse(id).success) {
      throw new Error('Invalid ID format')
    }
  }

  const supabase = await createClient()
  const user = await checkTeacherAuth(supabase)
  await verifyClassOwnership(supabase, classId, user.id)

  let query = supabase
    .from('grades')
    .select('*')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .eq('term_id', termId)
    .eq('topic_id', topicId)
    .order('assessed_date', { ascending: true })

  if (subtopicId) {
    query = query.eq('subtopic_id', subtopicId)
  } else {
    query = query.is('subtopic_id', null)
  }

  const { data: grades, error } = await query

  if (error) throw error

  return grades || []
}
