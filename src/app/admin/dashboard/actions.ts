'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAdminDashboardData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata.role !== 'admin') {
    throw new Error('Not authorized')
  }

  // 1. Get Active Term
  const { data: activeTerm } = await supabase
    .from('terms')
    .select('*')
    .eq('is_active', true)
    .single()

  // 2. System Overview Stats
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

  const { count: totalCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })

  const { count: totalGrades } = activeTerm
    ? await supabase
        .from('grades')
        .select('*', { count: 'exact', head: true })
        .eq('term_id', activeTerm.id)
    : { count: 0 }

  // 3. Flagged Students Institute-Wide
  let flaggedCount = 0
  let flagBreakdown = { one: 0, two: 0, three: 0 }

  if (activeTerm) {
    const { data: lpData } = await supabase
      .from('grades')
      .select('student_id')
      .eq('term_id', activeTerm.id)
      .eq('is_low_point', true)

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

    flaggedCount = flaggedStudents.length
    flagBreakdown = {
      one: flaggedStudents.filter((s) => s.flags === 1).length,
      two: flaggedStudents.filter((s) => s.flags === 2).length,
      three: flaggedStudents.filter((s) => s.flags === 3).length,
    }
  }

  // 4. Recent System Activity
  // We'll join grades, class_students, and parent_contacts to get a combined feed
  // For now, let's get the most recent grades and enrollments
  const { data: recentGrades } = await supabase
    .from('grades')
    .select(
      `
      id,
      created_at,
      marks_obtained,
      total_marks,
      entered_by,
      profiles:entered_by (full_name),
      classes (name),
      students (name)
    `,
    )
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentEnrollments } = await supabase
    .from('class_students')
    .select(
      `
      id,
      enrolled_at,
      classes (name),
      students (name)
    `,
    )
    .order('enrolled_at', { ascending: false })
    .limit(10)

  const activities = [
    ...(recentGrades?.map((g) => {
      const profile = Array.isArray(g.profiles) ? g.profiles[0] : g.profiles
      const student = Array.isArray(g.students) ? g.students[0] : g.students
      const cls = Array.isArray(g.classes) ? g.classes[0] : g.classes
      return {
        id: `grade-${g.id}`,
        type: 'grade',
        message: `Teacher ${profile?.full_name || 'Unknown'} added grade for ${student?.name} in ${cls?.name}`,
        timestamp: g.created_at,
      }
    }) || []),
    ...(recentEnrollments?.map((e) => {
      const student = Array.isArray(e.students) ? e.students[0] : e.students
      const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes
      return {
        id: `enroll-${e.id}`,
        type: 'enrollment',
        message: `New student ${student?.name} enrolled in ${cls?.name}`,
        timestamp: e.enrolled_at,
      }
    }) || []),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15)

  // 5. Institute Performance Overview
  let instituteAvg = 0
  let lpPercentage = 0
  if (activeTerm) {
    const { data: allGrades } = await supabase
      .from('grades')
      .select('percentage, is_low_point')
      .eq('term_id', activeTerm.id)

    if (allGrades && allGrades.length > 0) {
      instituteAvg = allGrades.reduce((acc, g) => acc + Number(g.percentage), 0) / allGrades.length
      lpPercentage = (allGrades.filter((g) => g.is_low_point).length / allGrades.length) * 100
    }
  }

  // 6. Class Performance Breakdown
  const { data: allClasses } = await supabase.from('classes').select(`
      id,
      name,
      profiles:teacher_id (full_name)
    `)

  const classPerformance = activeTerm
    ? await Promise.all(
        (allClasses || []).map(async (cls) => {
          const { count: studentCount } = await supabase
            .from('class_students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id)

          const { data: grades } = await supabase
            .from('grades')
            .select('percentage, is_low_point')
            .eq('class_id', cls.id)
            .eq('term_id', activeTerm.id)

          const avg =
            grades && grades.length > 0
              ? grades.reduce((acc, g) => acc + Number(g.percentage), 0) / grades.length
              : 0

          const lpCount = grades?.filter((g) => g.is_low_point).length || 0
          const profile = Array.isArray(cls.profiles) ? cls.profiles[0] : cls.profiles

          return {
            id: cls.id,
            name: cls.name,
            teacher: profile?.full_name || 'Unassigned',
            studentCount: studentCount || 0,
            gradesEntered: grades?.length || 0,
            avgPercentage: Math.round(avg),
            lpCount,
          }
        }),
      )
    : []

  // 7. Teacher Activity Summary
  const { data: teachers } = await supabase.from('profiles').select('*').eq('role', 'teacher')

  const teacherSummary = activeTerm
    ? await Promise.all(
        (teachers || []).map(async (t) => {
          const { count: classCount } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', t.id)

          const { data: teacherGrades } = await supabase
            .from('grades')
            .select('id, created_at')
            .eq('entered_by', t.id)
            .eq('term_id', activeTerm.id)

          return {
            id: t.id,
            name: t.full_name || 'Unknown',
            classCount: classCount || 0,
            gradesEntered: teacherGrades?.length || 0,
            lastActivity:
              teacherGrades?.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
              )[0]?.created_at || null,
          }
        }),
      )
    : []

  return {
    activeTerm,
    stats: {
      totalStudents: totalStudents || 0,
      totalTeachers: totalTeachers || 0,
      totalClasses: totalClasses || 0,
      totalCourses: totalCourses || 0,
      totalGrades: totalGrades || 0,
    },
    flagBreakdown,
    flaggedCount,
    activities,
    institutePerformance: {
      instituteAvg: Math.round(instituteAvg),
      lpPercentage: Math.round(lpPercentage),
    },
    classPerformance,
    teacherSummary,
  }
}
