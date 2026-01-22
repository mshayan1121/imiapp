'use server'

import { createClient } from '@/utils/supabase/server'
import { unstable_cache } from 'next/cache'

export async function getDashboardData() {
  // First get user to create cache key (auth check outside cache)
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Capture userId before cache function to avoid closure issues
  const userId = user.id

  // Cache per user (teacher) - each teacher sees different data
  return unstable_cache(
    async () => {
      // Use admin client for read-only queries (doesn't require cookies)
      // We already validated auth outside the cache
      const { createAdminClient } = await import('@/utils/supabase/admin')
      const supabase = createAdminClient()
      // Use the userId captured outside the cache
      const cachedUser = { id: userId }

      // 1. Get Active Term, Teacher Profile, and Classes Count (parallelized)
      const [
        { data: activeTerm, error: activeTermError },
        { data: profile },
        { count: classesCount },
        { data: teacherClassesForIds },
      ] = await Promise.all([
        supabase
          .from('terms')
          .select('id, name, is_active, start_date, end_date')
          .eq('is_active', true)
          .single(),
        supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', cachedUser.id)
          .single(),
        supabase
          .from('classes')
          .select('id', { count: 'exact', head: true })
          .eq('teacher_id', cachedUser.id),
        supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', cachedUser.id)
          .limit(50),
      ])

      let finalActiveTerm = activeTerm
      if (activeTermError || !activeTerm) {
        console.warn('No active term found, falling back to most recent term')
        const { data: latestTerm } = await supabase
          .from('terms')
          .select('id, name, is_active, start_date, end_date')
          .order('end_date', { ascending: false })
          .limit(1)
          .single()

        finalActiveTerm = latestTerm
      }

      if (!finalActiveTerm) {
        return { noTerms: true } as any
      }

      // 4. Count Students (unique across all teacher's classes)
      const classIds = teacherClassesForIds?.map((c) => c.id) || []
      const { data: studentIds } = classIds.length > 0
        ? await supabase
            .from('class_students')
            .select('student_id')
            .in('class_id', classIds)
            .limit(500) // Reasonable limit for student IDs
        : { data: [] }

      const uniqueStudentIds = Array.from(new Set(studentIds?.map((s) => s.student_id) || []))
      const studentsCount = uniqueStudentIds.length

      // 5. Count Grades Entered in Active Term
      const { count: gradesCount } = await supabase
        .from('grades')
        .select('id', { count: 'exact', head: true })
        .eq('entered_by', cachedUser.id)
        .eq('term_id', finalActiveTerm.id)

      // 6. Flagged Students
      // We need to calculate flags for students in teacher's classes
      // A student is flagged if they have 3+ LP in the active term
      // 3 LP = 1 Flag, 4 LP = 2 Flags, 5+ LP = 3 Flags

      const { data: lpData } = classIds.length > 0
        ? await supabase
            .from('grades')
            .select('student_id')
            .eq('term_id', finalActiveTerm.id)
            .eq('is_low_point', true)
            .in('class_id', classIds)
            .limit(500) // Reasonable limit for LP data
        : { data: [] }

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
        .eq('entered_by', cachedUser.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // 8. Class Performance
      const { data: teacherClasses } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', cachedUser.id)
        .limit(50)

      const classPerformance = await Promise.all(
        (teacherClasses || []).map(async (cls) => {
          // Student count in this class
          const { count: studentCount } = await supabase
            .from('class_students')
            .select('id', { count: 'exact', head: true })
            .eq('class_id', cls.id)

          // Average percentage in this class for active term
          const { data: grades } = await supabase
            .from('grades')
            .select('percentage, is_low_point')
            .eq('class_id', cls.id)
            .eq('term_id', finalActiveTerm.id)
            .limit(500) // Reasonable limit for grades per class

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
        activeTerm: finalActiveTerm,
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
    },
    [`teacher-dashboard-${userId}`], // User-specific cache key
    {
      revalidate: 60, // 60 seconds
      tags: ['teacher-dashboard', `teacher-${user.id}`, 'grades', 'terms']
    }
  )()
}
