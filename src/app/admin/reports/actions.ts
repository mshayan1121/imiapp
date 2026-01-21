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
  const supabase = createAdminClient()

  const { data: activeTerm } = await supabase
    .from('terms')
    .select('*')
    .eq('is_active', true)
    .single()

  const termId = filters.term_id || activeTerm?.id
  if (!termId) return { data: [], summary: null }

  // Get class performance data
  let classQuery = supabase.from('classes').select(`
    id,
    name,
    teacher_id
  `)

  if (filters.class_id) {
    classQuery = classQuery.eq('id', filters.class_id)
  }

  const { data: classes } = await classQuery

  if (!classes || classes.length === 0) {
    return { data: [], summary: { totalClasses: 0, overallAvg: 0 } }
  }

  // Fetch teacher profiles separately
  const teacherIds = Array.from(new Set(
    classes.map((cls: any) => cls.teacher_id).filter(Boolean)
  )) as string[]

  const { data: teacherProfiles } = teacherIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds)
    : { data: null }

  const teacherMap = new Map(
    (teacherProfiles || []).map((t: any) => [t.id, t.full_name])
  )

  const classPerformance = await Promise.all(
    classes.map(async (cls: any) => {
      const { data: grades } = await supabase
        .from('grades')
        .select('percentage, is_low_point, student_id')
        .eq('class_id', cls.id)
        .eq('term_id', termId)

      const avg =
        grades && grades.length > 0
          ? grades.reduce((acc: number, g: any) => acc + Number(g.percentage), 0) / grades.length
          : 0

      const lpCount = grades?.filter((g: any) => g.is_low_point).length || 0

      return {
        id: cls.id,
        name: cls.name,
        teacher: teacherMap.get(cls.teacher_id) || 'Unassigned',
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
  const supabase = createAdminClient()

  let query = supabase
    .from('grades')
    .select(
      `
      *,
      students (id, name),
      classes (id, name),
      courses (id, name),
      topics (id, name),
      subtopics (id, name)
    `,
      { count: 'exact' },
    )
    .order('assessed_date', { ascending: false })

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
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = await createClient()

  const { data: classes } = await supabase.from('classes').select('id')

  if (!classes) return []

  const allProgress = await Promise.all(
    classes.map((c) =>
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
  const { data: contacts } = await supabase
    .from('parent_contacts')
    .select('*')
    .eq('term_id', termId)
    .in('student_id', studentIds)

  return flaggedStudents.map((s: any) => ({
    ...s,
    contacts: (contacts || []).filter((c: any) => c.student_id === s.student_id),
  }))
}

export async function getSummaryReport(dateRange?: { start: string; end: string }) {
  const supabase = createAdminClient()

  const { data: activeTerm } = await supabase
    .from('terms')
    .select('*')
    .eq('is_active', true)
    .single()

  // Get counts
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })

  const { count: totalTeachers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher')

  const { count: totalClasses } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })

  let gradeQuery = supabase.from('grades').select('*', { count: 'exact', head: true })
  if (dateRange?.start) gradeQuery = gradeQuery.gte('assessed_date', dateRange.start)
  if (dateRange?.end) gradeQuery = gradeQuery.lte('assessed_date', dateRange.end)
  if (activeTerm) gradeQuery = gradeQuery.eq('term_id', activeTerm.id)

  const { count: totalGrades } = await gradeQuery

  return {
    totalStudents: totalStudents || 0,
    totalTeachers: totalTeachers || 0,
    totalClasses: totalClasses || 0,
    totalGrades: totalGrades || 0,
    activeTerm: activeTerm?.name || 'No Active Term',
  }
}

export async function getReportFiltersData() {
  const supabase = createAdminClient()

  const { data: terms } = await supabase
    .from('terms')
    .select('id, name, is_active')
    .order('start_date', { ascending: false })

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .order('name', { ascending: true })

  const { data: courses } = await supabase
    .from('courses')
    .select('id, name')
    .order('name', { ascending: true })

  return {
    terms: terms || [],
    classes: classes || [],
    courses: courses || [],
  }
}
