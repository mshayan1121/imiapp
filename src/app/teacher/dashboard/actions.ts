'use server'

import { createClient } from '@/utils/supabase/server'

export async function getDashboardData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // 1. Get Active Term
  let { data: activeTerm, error: activeTermError } = await supabase
    .from('terms')
    .select('*')
    .eq('is_active', true)
    .single()

  if (activeTermError || !activeTerm) {
    console.warn('No active term found, falling back to most recent term')
    const { data: latestTerm } = await supabase
      .from('terms')
      .select('*')
      .order('end_date', { ascending: false })
      .limit(1)
      .single()

    activeTerm = latestTerm
  }

  if (!activeTerm) {
    return { noTerms: true } as any
  }

  // 2. Get Teacher Profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // 3. Count Classes
  const { count: classesCount } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', user.id)

  // 4. Count Students (unique across all teacher's classes)
  const { data: studentIds } = await supabase
    .from('class_students')
    .select('student_id')
    .in(
      'class_id',
      (await supabase.from('classes').select('id').eq('teacher_id', user.id)).data?.map(
        (c) => c.id,
      ) || [],
    )

  const uniqueStudentIds = Array.from(new Set(studentIds?.map((s) => s.student_id) || []))
  const studentsCount = uniqueStudentIds.length

  // 5. Count Grades Entered in Active Term
  const { count: gradesCount } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
    .eq('entered_by', user.id)
    .eq('term_id', activeTerm.id)

  // 6. Flagged Students
  // We need to calculate flags for students in teacher's classes
  // A student is flagged if they have 3+ LP in the active term
  // 3 LP = 1 Flag, 4 LP = 2 Flags, 5+ LP = 3 Flags

  const { data: lpData } = await supabase
    .from('grades')
    .select('student_id')
    .eq('term_id', activeTerm.id)
    .eq('is_low_point', true)
    .in(
      'class_id',
      (await supabase.from('classes').select('id').eq('teacher_id', user.id)).data?.map(
        (c) => c.id,
      ) || [],
    )

  const studentLpCounts: Record<string, number> = {}
  lpData?.forEach((g) => {
    studentLpCounts[g.student_id] = (studentLpCounts[g.student_id] || 0) + 1
  })

  const flaggedStudents = Object.entries(studentLpCounts)
    .map(([studentId, count]) => {
      let flags = 0
      if (count >= 5) flags = 3
      else if (count === 4) flags = 2
      else if (count === 3) flags = 1

      return { studentId, flags }
    })
    .filter((s) => s.flags > 0)

  const flaggedCount = flaggedStudents.length
  const flagBreakdown = {
    one: flaggedStudents.filter((s) => s.flags === 1).length,
    two: flaggedStudents.filter((s) => s.flags === 2).length,
    three: flaggedStudents.filter((s) => s.flags === 3).length,
  }

  // 7. Recent 10 Grades
  const { data: recentGrades } = await supabase
    .from('grades')
    .select(
      `
      id,
      assessed_date,
      marks_obtained,
      total_marks,
      percentage,
      is_low_point,
      students (name),
      classes (name),
      topics (name),
      subtopics (name)
    `,
    )
    .eq('entered_by', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // 8. Class Performance
  const { data: teacherClasses } = await supabase
    .from('classes')
    .select(
      `
      id,
      name
    `,
    )
    .eq('teacher_id', user.id)

  const classPerformance = await Promise.all(
    (teacherClasses || []).map(async (cls) => {
      // Student count in this class
      const { count: studentCount } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', cls.id)

      // Average percentage in this class for active term
      const { data: grades } = await supabase
        .from('grades')
        .select('percentage, is_low_point')
        .eq('class_id', cls.id)
        .eq('term_id', activeTerm.id)

      const avgPercentage =
        grades && grades.length > 0
          ? grades.reduce((acc, g) => acc + Number(g.percentage), 0) / grades.length
          : 0

      const lowPointCount = grades?.filter((g) => g.is_low_point).length || 0

      return {
        id: cls.id,
        name: cls.name,
        studentCount: studentCount || 0,
        avgPercentage: Math.round(avgPercentage),
        lowPointCount,
      }
    }),
  )

  // 9. Fetch top critical students (3 flags)
  const criticalStudentIds = flaggedStudents
    .filter((s) => s.flags === 3)
    .slice(0, 5)
    .map((s) => s.studentId)

  const { data: criticalStudents } = await supabase
    .from('students')
    .select('id, name')
    .in('id', criticalStudentIds)

  return {
    teacherName: profile?.full_name || 'Teacher',
    activeTerm,
    stats: {
      classesCount: classesCount || 0,
      studentsCount,
      gradesCount: gradesCount || 0,
      flaggedCount,
    },
    flagBreakdown,
    criticalStudents: criticalStudents || [],
    classPerformance,
    recentGrades: (recentGrades || []).map(g => ({
      ...g,
      students: Array.isArray(g.students) ? g.students[0] : g.students,
      classes: Array.isArray(g.classes) ? g.classes[0] : g.classes,
      topics: Array.isArray(g.topics) ? g.topics[0] : g.topics,
      subtopics: Array.isArray(g.subtopics) ? g.subtopics[0] : g.subtopics,
    })),
  }
}
