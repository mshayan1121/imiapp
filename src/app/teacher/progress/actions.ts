'use server'

import { createClient } from '@/utils/supabase/server'
import { StudentProgressSummary, Grade, Student } from '@/types/grades'

export async function getClassProgress(
  classId: string,
  termId: string,
): Promise<StudentProgressSummary[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_student_progress_summary', {
    p_class_id: classId,
    p_term_id: termId,
  })

  if (error) throw error
  return (data || []) as StudentProgressSummary[]
}

export async function getStudentDetailProgress(studentId: string, termId: string) {
  const supabase = await createClient()

  // Get student info
  const { data: studentData } = await supabase
    .from('students')
    .select(
      `
      *,
      class_students (
        classes (id, name),
        courses (id, name)
      )
    `,
    )
    .eq('id', studentId)
    .single()

  const studentInfo = studentData ? {
    ...studentData,
    class_students: (studentData as any).class_students?.map((cs: any) => ({
      ...cs,
      classes: Array.isArray(cs.classes) ? cs.classes[0] : cs.classes,
      courses: Array.isArray(cs.courses) ? cs.courses[0] : cs.courses,
    }))
  } : null

  // Get all grades for this student in this term
  const { data: gradesData } = await supabase
    .from('grades')
    .select(
      `
      *,
      topics (id, name),
      subtopics (id, name)
    `,
    )
    .eq('student_id', studentId)
    .eq('term_id', termId)
    .order('assessed_date', { ascending: true })

  const typedGrades = (gradesData || []).map((g: any) => ({
    ...g,
    topics: Array.isArray(g.topics) ? g.topics[0] : g.topics,
    subtopics: Array.isArray(g.subtopics) ? g.subtopics[0] : g.subtopics,
  })) as Grade[]

  // Calculate stats
  const totalGrades = typedGrades.length
  const totalLP = typedGrades.filter((g) => g.is_low_point).length
  const avgPercentage =
    totalGrades > 0
      ? typedGrades.reduce((acc, g) => acc + Number(g.percentage), 0) / totalGrades
      : 0

  // Group by topic/subtopic for performance analysis
  const performanceByTopic: Record<string, any> = {}
  typedGrades.forEach((g) => {
    const topicName = g.topics?.name || 'Unknown Topic'
    const subtopicName = g.subtopics?.name || 'Unknown Subtopic'
    const key = `${topicName} - ${subtopicName}`

    if (!performanceByTopic[key]) {
      performanceByTopic[key] = {
        name: key,
        topic: topicName,
        subtopic: subtopicName,
        count: 0,
        best: 0,
        latest: 0,
        avg: 0,
        lpCount: 0,
        scores: [] as number[],
      }
    }
    const p = performanceByTopic[key]
    p.count++
    p.best = Math.max(p.best, g.percentage)
    p.latest = g.percentage // Since they are ordered by date
    p.lpCount += g.is_low_point ? 1 : 0
    p.scores.push(g.percentage)
    p.avg = p.scores.reduce((a: number, b: number) => a + b, 0) / p.count
  })

  return {
    studentInfo: studentInfo as any,
    overallStats: {
      totalGrades,
      totalLP,
      averagePercentage: Math.round(avgPercentage * 10) / 10,
    },
    topicPerformance: Object.values(performanceByTopic),
    gradeTimeline: typedGrades,
  }
}

export async function getCourseProgressData(
  studentId: string,
  classId: string,
  courseId: string,
  termId: string,
) {
  const supabase = await createClient()

  // Get student info with class details
  const { data: studentData } = await supabase
    .from('students')
    .select(
      `
      *,
      class_students!inner (
        id,
        classes!inner (id, name),
        courses!inner (
          id, 
          name, 
          subject_id,
          boards (name),
          qualifications (name)
        )
      )
    `,
    )
    .eq('id', studentId)
    .eq('class_students.class_id', classId)
    .eq('class_students.course_id', courseId)
    .single()

  if (!studentData) throw new Error('Student not found in this class/course context')

  const studentInfo = {
    ...studentData,
    class_students: (studentData as any).class_students?.map((cs: any) => ({
      ...cs,
      classes: Array.isArray(cs.classes) ? cs.classes[0] : cs.classes,
      courses: Array.isArray(cs.courses) ? {
        ...cs.courses[0],
        boards: Array.isArray(cs.courses[0].boards) ? cs.courses[0].boards[0] : cs.courses[0].boards,
        qualifications: Array.isArray(cs.courses[0].qualifications) ? cs.courses[0].qualifications[0] : cs.courses[0].qualifications,
      } : {
        ...cs.courses,
        boards: Array.isArray(cs.courses.boards) ? cs.courses.boards[0] : cs.courses.boards,
        qualifications: Array.isArray(cs.courses.qualifications) ? cs.courses.qualifications[0] : cs.courses.qualifications,
      },
    }))
  }

  const subjectId = (studentInfo as any).class_students[0].courses.subject_id

  // Get full curriculum structure
  const { data: topicsData } = await supabase
    .from('topics')
    .select(
      `
      id,
      name,
      subtopics (
        id,
        name
      )
    `,
    )
    .eq('subject_id', subjectId)
    .order('name')

  const topics = (topicsData || []).map((t: any) => ({
    ...t,
    subtopics: Array.isArray(t.subtopics) ? t.subtopics : [t.subtopics].filter(Boolean)
  }))

  // Get all grades for this student in this term/class/course
  const { data: gradesData } = await supabase
    .from('grades')
    .select(
      `
      *,
      topics (id, name),
      subtopics (id, name)
    `,
    )
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .eq('course_id', courseId)
    .eq('term_id', termId)
    .order('assessed_date', { ascending: false })

  const grades = (gradesData || []).map((g: any) => ({
    ...g,
    topics: Array.isArray(g.topics) ? g.topics[0] : g.topics,
    subtopics: Array.isArray(g.subtopics) ? g.subtopics[0] : g.subtopics,
  })) as Grade[]

  return {
    studentInfo,
    topics: topics || [],
    grades: grades,
  }
}

export async function upsertGrade(gradeData: any) {
  const supabase = await createClient()
  const {
    id,
    student_id,
    class_id,
    course_id,
    term_id,
    topic_id,
    subtopic_id,
    work_type,
    work_subtype,
    marks_obtained,
    total_marks,
    assessed_date,
    notes,
    attempt_number,
  } = gradeData

  const percentage = Math.round((marks_obtained / total_marks) * 100 * 10) / 10
  const is_low_point = percentage < 80

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const payload = {
    student_id,
    class_id,
    course_id,
    term_id,
    topic_id,
    subtopic_id: subtopic_id || null,
    work_type,
    work_subtype,
    marks_obtained,
    total_marks,
    percentage,
    is_low_point,
    assessed_date,
    notes,
    attempt_number: attempt_number || 1,
    entered_by: user.id,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await supabase.from('grades').update(payload).eq('id', id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('grades').insert({
      ...payload,
      id: undefined,
      created_at: new Date().toISOString(),
    })
    if (error) throw error
  }

  return { success: true }
}

export async function deleteGradeAction(gradeId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('grades').delete().eq('id', gradeId)
  if (error) throw error
  return { success: true }
}
