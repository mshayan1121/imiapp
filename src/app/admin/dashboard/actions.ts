'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'

export async function getAdminDashboardData() {
  // Auth check must happen OUTSIDE the cache function (uses cookies)
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()

  if (!user || user.user_metadata.role !== 'admin') {
    throw new Error('Not authorized')
  }

  // Cache the data fetching part - use admin client that doesn't need cookies
  return unstable_cache(
    async () => {
      // Use admin client for read-only queries (doesn't require cookies)
      const { createAdminClient } = await import('@/utils/supabase/admin')
      const supabase = createAdminClient()

      // 1. Get Active Term and System Overview Stats (parallelized)
      const [
        { data: activeTerm },
        { count: totalStudents },
        { count: totalTeachers },
        { count: totalClasses },
        { count: totalCourses },
      ] = await Promise.all([
        supabase
          .from('terms')
          .select('id, name, is_active, start_date, end_date')
          .eq('is_active', true)
          .single(),
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'teacher'),
        supabase
          .from('classes')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('courses')
          .select('id', { count: 'exact', head: true }),
      ])

      const { count: totalGrades } = activeTerm
        ? await supabase
            .from('grades')
            .select('id', { count: 'exact', head: true })
            .eq('term_id', activeTerm.id)
        : { count: 0 }

  // 3. Flagged Students Institute-Wide
  let flaggedCount = 0
  let totalFlags = 0
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
    totalFlags = flaggedStudents.reduce((acc, s) => acc + s.flags, 0)
    flagBreakdown = {
      one: flaggedStudents.filter((s) => s.flags === 1).length,
      two: flaggedStudents.filter((s) => s.flags === 2).length,
      three: flaggedStudents.filter((s) => s.flags === 3).length,
    }
  }

  // 4. Recent System Activity
  // We'll join grades, class_students, and parent_contacts to get a combined feed
  // For now, let's get the most recent grades and enrollments
  const { data: recentGradesRaw } = await supabase
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

  const recentGrades = (recentGradesRaw || []).map((g: any) => ({
    ...g,
    profiles: Array.isArray(g.profiles) ? g.profiles[0] : g.profiles,
    classes: Array.isArray(g.classes) ? g.classes[0] : g.classes,
    students: Array.isArray(g.students) ? g.students[0] : g.students,
  }))

  const { data: recentEnrollmentsRaw } = await supabase
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

  const recentEnrollments = (recentEnrollmentsRaw || []).map((e: any) => ({
    ...e,
    classes: Array.isArray(e.classes) ? e.classes[0] : e.classes,
    students: Array.isArray(e.students) ? e.students[0] : e.students,
  }))

  const activities = [
    ...(recentGrades?.map((g) => {
      return {
        id: `grade-${g.id}`,
        type: 'grade',
        message: `Teacher ${g.profiles?.full_name || 'Unknown'} added grade for ${g.students?.name} in ${g.classes?.name}`,
        timestamp: g.created_at,
      }
    }) || []),
    ...(recentEnrollments?.map((e) => {
      return {
        id: `enroll-${e.id}`,
        type: 'enrollment',
        message: `New student ${e.students?.name} enrolled in ${e.classes?.name}`,
        timestamp: e.enrolled_at,
      }
    }) || []),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15)

  // 5. Institute Performance Overview
  let instituteAvg = 0
  let lpPercentage = 0
  let flagRate = 0
  if (activeTerm) {
    const { data: allGrades } = await supabase
      .from('grades')
      .select('percentage, is_low_point, student_id')
      .eq('term_id', activeTerm.id)

    if (allGrades && allGrades.length > 0) {
      instituteAvg = allGrades.reduce((acc, g) => acc + Number(g.percentage), 0) / allGrades.length
      
      const studentLpCounts: Record<string, number> = {}
      allGrades.forEach((g) => {
        if (g.is_low_point) {
          studentLpCounts[g.student_id] = (studentLpCounts[g.student_id] || 0) + 1
        }
      })
      
      const flaggedStudentCount = Object.values(studentLpCounts).filter(count => count >= 3).length
      flagRate = (flaggedStudentCount / (totalStudents || 1)) * 100
      lpPercentage = (allGrades.filter((g) => g.is_low_point).length / allGrades.length) * 100
    }
  }

  // 6. Class Performance Breakdown
  const { data: allClassesRaw } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      profiles:teacher_id (full_name)
    `)
    .limit(50)

  const allClasses = (allClassesRaw || []).map((cls: any) => ({
    ...cls,
    profiles: Array.isArray(cls.profiles) ? cls.profiles[0] : cls.profiles,
  }))

  const classPerformance = activeTerm
    ? await Promise.all(
        (allClasses || []).map(async (cls) => {
          const { count: studentCount } = await supabase
            .from('class_students')
            .select('id', { count: 'exact', head: true })
            .eq('class_id', cls.id)

          const { data: grades } = await supabase
            .from('grades')
            .select('percentage, is_low_point, student_id')
            .eq('class_id', cls.id)
            .eq('term_id', activeTerm.id)

          const avg =
            grades && grades.length > 0
              ? grades.reduce((acc, g) => acc + Number(g.percentage), 0) / grades.length
              : 0

          const lpCount = grades?.filter((g) => g.is_low_point).length || 0
          
          // Calculate flags for this class
          const classStudentLps: Record<string, number> = {}
          grades?.forEach(g => {
            if (g.is_low_point) {
              classStudentLps[g.student_id] = (classStudentLps[g.student_id] || 0) + 1
            }
          })
          
          let classFlagCount = 0
          Object.values(classStudentLps).forEach(count => {
            if (count >= 5) classFlagCount += 3
            else if (count === 4) classFlagCount += 2
            else if (count === 3) classFlagCount += 1
          })

          const profile = Array.isArray(cls.profiles) ? cls.profiles[0] : cls.profiles

          return {
            id: cls.id,
            name: cls.name,
            teacher: profile?.full_name || 'Unassigned',
            studentCount: studentCount || 0,
            gradesEntered: grades?.length || 0,
            avgPercentage: Math.round(avg),
            lpCount,
            flagCount: classFlagCount,
          }
        }),
      )
    : []

  // 7. Teacher Activity Summary
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'teacher')
    .limit(50)

  const teacherSummary = activeTerm
    ? await Promise.all(
        (teachers || []).map(async (t) => {
          const { count: classCount } = await supabase
            .from('classes')
            .select('id', { count: 'exact', head: true })
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
            lastActivity:
              teacherGrades?.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
              )[0]?.created_at || null,
          }
        }),
      )
    : []

  // 8. Performance Trends Data
  let performanceTrends = {
    performanceData: [] as { term: string; avg: number }[],
    subjectData: [] as { subject: string; flags: number }[],
    gradeDistribution: [] as { name: string; value: number; color: string }[]
  }

  if (activeTerm) {
    // 8.1 Performance over terms
    const { data: allTerms } = await supabase
      .from('terms')
      .select('id, name')
      .order('start_date', { ascending: true })
      .limit(50)
    
    if (allTerms) {
      performanceTrends.performanceData = await Promise.all(allTerms.map(async (term) => {
        const { data: termGrades } = await supabase
          .from('grades')
          .select('percentage')
          .eq('term_id', term.id)
        
        const avg = termGrades && termGrades.length > 0 
          ? termGrades.reduce((acc, g) => acc + Number(g.percentage), 0) / termGrades.length 
          : 0
        
        return { term: term.name, avg: Math.round(avg) }
      }))
    }

    // 8.2 Flags by subject
    const { data: subjectGrades } = await supabase
      .from('grades')
      .select(`
        is_low_point,
        student_id,
        courses (name)
      `)
      .eq('term_id', activeTerm.id)
      .eq('is_low_point', true)

    if (subjectGrades) {
      const subjectLpMap: Record<string, Record<string, number>> = {} // subject -> student_id -> lp_count
      subjectGrades.forEach(g => {
        const subjectName = (g.courses as any)?.name || 'Unknown'
        if (!subjectLpMap[subjectName]) subjectLpMap[subjectName] = {}
        subjectLpMap[subjectName][g.student_id] = (subjectLpMap[subjectName][g.student_id] || 0) + 1
      })

      performanceTrends.subjectData = Object.entries(subjectLpMap).map(([subject, students]) => {
        let subjectFlagCount = 0
        Object.values(students).forEach(count => {
          if (count >= 5) subjectFlagCount += 3
          else if (count === 4) subjectFlagCount += 2
          else if (count === 3) subjectFlagCount += 1
        })
        return { subject, flags: subjectFlagCount }
      })
    }

    // 8.3 Grade distribution
    const { data: distGrades } = await supabase
      .from('grades')
      .select('percentage')
      .eq('term_id', activeTerm.id)

    if (distGrades) {
      const low = distGrades.filter(g => g.percentage < 60).length
      const mid = distGrades.filter(g => g.percentage >= 60 && g.percentage <= 80).length
      const high = distGrades.filter(g => g.percentage > 80).length

      performanceTrends.gradeDistribution = [
        { name: '< 60%', value: low, color: '#ef4444' },
        { name: '60-80%', value: mid, color: '#f59e0b' },
        { name: '> 80%', value: high, color: '#22c55e' },
      ]
    }
  }

      return {
        activeTerm,
        stats: {
          totalStudents: totalStudents || 0,
          totalTeachers: totalTeachers || 0,
          totalClasses: totalClasses || 0,
          totalCourses: totalCourses || 0,
          totalGrades: totalGrades || 0,
          totalFlags: totalFlags,
        },
        flagBreakdown,
        flaggedCount,
        activities,
        institutePerformance: {
          instituteAvg: Math.round(instituteAvg),
          flagRate: Math.round(flagRate),
        },
        classPerformance,
        teacherSummary,
        performanceTrends,
      }
    },
    ['admin-dashboard-data'], // Cache key
    {
      revalidate: 60, // 60 seconds - short cache for fresh dashboard data
      tags: ['admin-dashboard', 'grades', 'students', 'terms'] // Tags for manual revalidation
    }
  )()
}
