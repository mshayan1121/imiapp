'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export interface ReportFilters {
  term_id?: string
  class_id?: string
  course_id?: string
  student_id?: string
  start_date?: string
  end_date?: string
}

export async function getPerformanceReport(filters: ReportFilters) {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const termId = filters.term_id

  // Get teacher's classes
  let classQuery = supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id)

  if (filters.class_id) {
    classQuery = classQuery.eq('id', filters.class_id)
  }

  const { data: classes } = await classQuery

  const classPerformance = await Promise.all(
    (classes || []).map(async (cls: any) => {
      let gradesQuery = supabase
        .from('grades')
        .select('percentage, is_low_point, student_id')
        .eq('class_id', cls.id)
        .eq('entered_by', user.id)

      if (termId) {
        gradesQuery = gradesQuery.eq('term_id', termId)
      }

      const { data: grades } = await gradesQuery

      const avg =
        grades && grades.length > 0
          ? grades.reduce((acc: number, g: any) => acc + Number(g.percentage), 0) / grades.length
          : 0

      const lpCount = grades?.filter((g: any) => g.is_low_point).length || 0

      return {
        id: cls.id,
        name: cls.name,
        avgPercentage: Math.round(avg),
        lpCount,
        gradeCount: grades?.length || 0,
      }
    }),
  )

  return {
    data: classPerformance,
    summary: {
      totalClasses: classPerformance.length,
      overallAvg: classPerformance.length > 0
        ? Math.round(classPerformance.reduce((acc, c) => acc + c.avgPercentage, 0) / classPerformance.length)
        : 0,
    },
  }
}

export async function getGradeReport(filters: ReportFilters) {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()

  let query = supabase
    .from('grades')
    .select(
      `
      id,
      assessed_date,
      marks_obtained,
      total_marks,
      percentage,
      is_low_point,
      work_type,
      term_id,
      class_id,
      course_id,
      student_id,
      topic_id,
      subtopic_id,
      entered_by,
      created_at,
      students (id, name),
      classes (id, name),
      courses (id, name),
      topics (id, name),
      subtopics (id, name)
    `,
      { count: 'exact' },
    )
    .eq('entered_by', user.id)
    .order('assessed_date', { ascending: false })
    .limit(50)

  if (filters.term_id) query = query.eq('term_id', filters.term_id)
  if (filters.class_id) query = query.eq('class_id', filters.class_id)
  if (filters.course_id) query = query.eq('course_id', filters.course_id)
  if (filters.student_id) query = query.eq('student_id', filters.student_id)
  if (filters.start_date) query = query.gte('assessed_date', filters.start_date)
  if (filters.end_date) query = query.lte('assessed_date', filters.end_date)

  const { data, count } = await query

  const grades = (data || []).map((g: any) => ({
    ...g,
    students: Array.isArray(g.students) ? g.students[0] : g.students,
    classes: Array.isArray(g.classes) ? g.classes[0] : g.classes,
    courses: Array.isArray(g.courses) ? g.courses[0] : g.courses,
    topics: Array.isArray(g.topics) ? g.topics[0] : g.topics,
    subtopics: Array.isArray(g.subtopics) ? g.subtopics[0] : g.subtopics,
  }))

  return { data: grades, count: count || 0 }
}

export async function getFlagReport(termId: string) {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { createClient: createServerClient } = await import('@/utils/supabase/server')
  const supabase = await createServerClient()

  // Get teacher's classes
  const { data: teacherClasses } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', user.id)

  if (!teacherClasses) return []

  const allProgress = await Promise.all(
    teacherClasses.map((c) =>
      supabase.rpc('get_student_progress_summary', {
        p_class_id: c.id,
        p_term_id: termId,
      }),
    ),
  )

  const flaggedStudents = allProgress
    .flatMap((res) => (res.data || []))
    .filter((s: any) => s.flag_count >= 1)

  const studentIds = flaggedStudents.map((s: any) => s.student_id)
  const { data: contacts } = studentIds.length > 0
    ? await supabase
        .from('parent_contacts')
        .select('id, student_id, term_id, contact_type, status, contacted_at, updated_at, notes')
        .eq('term_id', termId)
        .in('student_id', studentIds)
        .limit(500)
    : { data: [] }

  return flaggedStudents.map((s: any) => ({
    ...s,
    contacts: (contacts || []).filter((c: any) => c.student_id === s.student_id),
  }))
}

export async function getSummaryReport(dateRange?: { start: string; end: string }) {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()

  const { count: classesCount } = await supabase
    .from('classes')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', user.id)

  let gradeQuery = supabase
    .from('grades')
    .select('id', { count: 'exact', head: true })
    .eq('entered_by', user.id)

  if (dateRange?.start) gradeQuery = gradeQuery.gte('assessed_date', dateRange.start)
  if (dateRange?.end) gradeQuery = gradeQuery.lte('assessed_date', dateRange.end)

  const { count: gradesCount } = await gradeQuery

  // Get unique student count
  const { data: studentIds } = await supabase
    .from('class_students')
    .select('student_id')
    .in(
      'class_id',
      (await supabase.from('classes').select('id').eq('teacher_id', user.id)).data?.map((c) => c.id) || [],
    )

  const uniqueStudentIds = Array.from(new Set(studentIds?.map((s) => s.student_id) || []))

  return {
    classesCount: classesCount || 0,
    studentsCount: uniqueStudentIds.length,
    gradesCount: gradesCount || 0,
  }
}

export async function getReportFiltersData() {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()

  const { data: terms } = await supabase
    .from('terms')
    .select('id, name, is_active')
    .order('start_date', { ascending: false })

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id)
    .order('name', { ascending: true })

  return {
    terms: terms || [],
    classes: classes || [],
  }
}
