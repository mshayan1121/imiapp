'use server'

import { createClient } from '@/utils/supabase/server'
import { unstable_cache } from 'next/cache'
import { measureAsync } from '@/lib/performance'
import { getActiveTerm } from '@/utils/supabase/cached-queries'

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
      return measureAsync('Teacher Dashboard Data Fetch', async () => {
        // Use admin client for read-only queries (doesn't require cookies)
        // We already validated auth outside the cache
        const { createAdminClient } = await import('@/utils/supabase/admin')
        const supabase = createAdminClient()
        // Use the userId captured outside the cache
        const cachedUser = { id: userId }

      // 1. Get Active Term from cache, Teacher Profile, and Classes (parallelized)
      const [
        activeTerm,
        { data: profile },
        { count: classesCount },
        { data: teacherClassesForIds },
      ] = await Promise.all([
        getActiveTerm(),
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
          .select('id, name')
          .eq('teacher_id', cachedUser.id)
          .limit(50),
      ])

      let finalActiveTerm = activeTerm
      if (!activeTerm) {
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

      // 4-6. Parallelize all data fetches with optimized queries
      const classIds = teacherClassesForIds?.map((c) => c.id) || []
      
      // Optimize: Combine student count and unique student IDs in one query
      // Also fetch class_id to get student counts per class in same query
      const [
        { data: classStudentsData },
        { count: gradesCount },
        { data: lpData },
      ] = await Promise.all([
        classIds.length > 0
          ? supabase
              .from('class_students')
              .select('student_id, class_id')
              .in('class_id', classIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from('grades')
          .select('id', { count: 'exact', head: true })
          .eq('entered_by', cachedUser.id)
          .eq('term_id', finalActiveTerm.id),
        classIds.length > 0
          ? supabase
              .from('grades')
              .select('student_id')
              .eq('term_id', finalActiveTerm.id)
              .eq('is_low_point', true)
              .in('class_id', classIds)
          : Promise.resolve({ data: [] }),
      ])

      // Calculate unique students and class student counts from single query
      const uniqueStudentIds = new Set<string>()
      const classStudentCountsMap: Record<string, number> = {}
      
      classStudentsData?.forEach((cs) => {
        uniqueStudentIds.add(cs.student_id)
        classStudentCountsMap[cs.class_id] = (classStudentCountsMap[cs.class_id] || 0) + 1
      })
      
      const studentsCount = uniqueStudentIds.size

      // 6. Flagged Students calculation (optimized)
      // A student is flagged if they have 3+ LP in the active term
      // 3 LP = 1 Flag, 4 LP = 2 Flags, 5+ LP = 3 Flags

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

      // 7-8. Fetch recent grades and class performance in parallel
      // Use database function for class performance to reduce queries
      // classIds is already defined above, reuse it

      const [
        { data: recentGrades },
        // Use database function for class performance (reduces queries)
        { data: classPerformanceData },
      ] = await Promise.all([
        supabase
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
          .limit(10),
        // Use database function to get class performance in one query
        classIds.length > 0 && finalActiveTerm
          ? supabase.rpc('get_class_performance_summary', {
              p_teacher_id: cachedUser.id,
              p_term_id: finalActiveTerm.id,
            })
          : Promise.resolve({ data: [] }),
      ])

      // Map database function results to expected format
      const classPerformance = (classPerformanceData || []).map((cp: any) => ({
        id: cp.class_id,
        name: cp.class_name,
        studentCount: cp.student_count || 0,
        avgPercentage: Math.round(Number(cp.avg_percentage || 0)),
        lowPointCount: cp.low_point_count || 0,
      }))

      // 9. Fetch top critical students (3 flags) - only if there are any
      const criticalStudentIds = flaggedStudents
        .filter((s) => s.flags === 3)
        .slice(0, 5)
        .map((s) => s.studentId)

      const { data: criticalStudents } = criticalStudentIds.length > 0
        ? await supabase
            .from('students')
            .select('id, name')
            .in('id', criticalStudentIds)
        : { data: [] }

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
      }, { route: '/teacher/dashboard', cache: 'enabled' })
    },
    [`teacher-dashboard-${userId}`], // User-specific cache key
    {
      revalidate: 60, // 60 seconds
      tags: ['teacher-dashboard', `teacher-${userId}`, 'grades', 'terms']
    }
  )()
}
