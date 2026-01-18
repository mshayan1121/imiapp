'use server'

import { createClient } from '@/utils/supabase/server'
import { StudentWithStats, StudentDirectoryFilters } from '@/types/students'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'

export async function getDirectoryData(
  filters: StudentDirectoryFilters,
  page: number = 1,
  pageSize: number = 20,
  role: 'admin' | 'teacher',
  teacherId?: string
) {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // 1. Fetch active term
  const { data: activeTerm } = await supabase
    .from('terms')
    .select('id')
    .eq('is_active', true)
    .single()

  if (!activeTerm) {
    return { students: [], count: 0, error: 'No active term found' }
  }

  // 2. Build base query for students
  let query = supabase
    .from('students')
    .select(`
      *,
      class_students (
        class:class_id (
          id,
          name,
          teacher_id
        ),
        course:course_id (
          id,
          name
        )
      )
    `, { count: 'exact' })

  // 3. Apply role-based filtering
  if (role === 'teacher' && teacherId) {
    // Get class IDs for this teacher
    const { data: teacherClasses } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', teacherId)
    
    const classIds = teacherClasses?.map(c => c.id) || []
    
    // Filter students enrolled in teacher's classes
    const { data: enrolledStudentIds } = await supabase
      .from('class_students')
      .select('student_id')
      .in('class_id', classIds)
    
    const studentIds = Array.from(new Set(enrolledStudentIds?.map(s => s.student_id) || []))
    query = query.in('id', studentIds)
  }

  // 4. Apply filters
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  if (filters.year_group) {
    query = query.eq('year_group', filters.year_group)
  }
  if (filters.school) {
    query = query.eq('school', filters.school)
  }

  // Filter by class if provided
  if (filters.class_id) {
    const { data: classStudentIds } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', filters.class_id)
    
    const studentIdsInClass = classStudentIds?.map(s => s.student_id) || []
    query = query.in('id', studentIdsInClass)
  }

  // Enrollment status filter
  if (filters.enrollment_status === 'enrolled') {
    const { data: enrolledIds } = await supabase.from('class_students').select('student_id')
    const ids = Array.from(new Set(enrolledIds?.map(s => s.student_id) || []))
    query = query.in('id', ids)
  } else if (filters.enrollment_status === 'not_enrolled') {
    const { data: enrolledIds } = await supabase.from('class_students').select('student_id')
    const ids = Array.from(new Set(enrolledIds?.map(s => s.student_id) || []))
    query = query.not('id', 'in', `(${ids.join(',')})`)
  }

  const { data: studentsDataRaw, count, error: studentsError } = await query
    .order('name', { ascending: true })
    .range(from, to)

  if (studentsError) {
    return { students: [], count: 0, error: studentsError.message }
  }

  const studentsData = (studentsDataRaw || []).map((s: any) => ({
    ...s,
    class_students: (s.class_students || []).map((cs: any) => ({
      ...cs,
      class: Array.isArray(cs.class) ? cs.class[0] : cs.class,
      course: Array.isArray(cs.course) ? cs.course[0] : cs.course,
    }))
  }))

  // 5. Fetch additional data (grades and profiles for teachers)
  const studentIds = studentsData.map(s => s.id)
  
  // Get all teacher IDs from the classes
  const teacherIds = Array.from(new Set(
    studentsData.flatMap(s => s.class_students.map((cs: any) => cs.class?.teacher_id))
  )).filter(Boolean) as string[]

  const [gradesRes, profilesRes] = await Promise.all([
    supabase
      .from('grades')
      .select('student_id, percentage, is_low_point')
      .in('student_id', studentIds)
      .eq('term_id', activeTerm.id),
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', teacherIds)
  ])

  const gradesData = gradesRes.data
  const profilesData = profilesRes.data

  // 6. Aggregate and filter by performance/flags
  let studentsWithStats: StudentWithStats[] = studentsData.map(student => {
    const studentGrades = gradesData?.filter(g => g.student_id === student.id) || []
    const totalGrades = studentGrades.length
    const lowPoints = studentGrades.filter(g => g.is_low_point).length
    const avgPercentage = totalGrades > 0 
      ? studentGrades.reduce((acc, g) => acc + Number(g.percentage), 0) / totalGrades
      : 0
    
    const flagCount = lowPoints >= 5 ? 3 : lowPoints === 4 ? 2 : lowPoints === 3 ? 1 : 0

    let status: 'On Track' | 'At Risk' | 'Struggling' = 'On Track'
    if (totalGrades > 0) {
      if (avgPercentage < 70) status = 'Struggling'
      else if (avgPercentage < 80) status = 'At Risk'
    }

    const formattedClassStudents = student.class_students.map((cs: any) => {
      const teacherProfile = profilesData?.find(p => p.id === cs.class.teacher_id)
      return {
        ...cs,
        class: {
          ...cs.class,
          teacher: teacherProfile ? {
            id: teacherProfile.id,
            full_name: teacherProfile.full_name
          } : undefined
        }
      }
    })

    return {
      ...student,
      class_students: formattedClassStudents,
      stats: {
        total_grades: totalGrades,
        low_points: lowPoints,
        flag_count: flagCount,
        average_percentage: avgPercentage,
        status
      }
    }
  })

  // Apply post-aggregation filters (performance and flags)
  if (filters.performance) {
    studentsWithStats = studentsWithStats.filter(s => {
      if (filters.performance === 'on_track') return s.stats.average_percentage >= 80
      if (filters.performance === 'at_risk') return s.stats.average_percentage >= 70 && s.stats.average_percentage < 80
      if (filters.performance === 'struggling') return s.stats.average_percentage < 70
      return true
    })
  }

  if (filters.flag_status) {
    studentsWithStats = studentsWithStats.filter(s => {
      if (filters.flag_status === 'none') return s.stats.flag_count === 0
      if (filters.flag_status === '1') return s.stats.flag_count === 1
      if (filters.flag_status === '2') return s.stats.flag_count === 2
      if (filters.flag_status === '3') return s.stats.flag_count === 3
      return true
    })
  }

  return {
    students: studentsWithStats,
    count: count || 0,
    activeTermId: activeTerm.id
  }
}

export async function getFilterOptions(role: 'admin' | 'teacher', teacherId?: string) {
  // Create a cache key that includes role and teacherId
  const cacheKey = `filter-options-${role}-${teacherId || 'all'}`
  
  return unstable_cache(
    async () => {
      // Use admin client for read-only queries (doesn't require cookies)
      const { createAdminClient } = await import('@/utils/supabase/admin')
      const supabase = createAdminClient()
      
      const { data: schools } = await supabase.from('students').select('school').not('school', 'is', null)
      const uniqueSchools = Array.from(new Set(schools?.map(s => s.school) || []))

      const { data: yearGroups } = await supabase.from('students').select('year_group').not('year_group', 'is', null)
      const uniqueYearGroups = Array.from(new Set(yearGroups?.map(s => s.year_group) || [])).sort()

      let classQuery = supabase.from('classes').select('id, name')
      if (role === 'teacher' && teacherId) {
        classQuery = classQuery.eq('teacher_id', teacherId)
      }
      const { data: classes } = await classQuery

      return {
        schools: uniqueSchools,
        yearGroups: uniqueYearGroups,
        classes: classes || []
      }
    },
    [cacheKey], // Cache key
    {
      revalidate: 300, // 5 minutes - these change rarely
      tags: ['filter-options', 'students', 'classes'] // Tags for manual revalidation
    }
  )()
}

export async function bulkEnrollStudents(studentIds: string[], classId: string, courseId: string) {
  const supabase = await createClient()
  
  const enrollments = studentIds.map(studentId => ({
    student_id: studentId,
    class_id: classId,
    course_id: courseId
  }))

  const { error } = await supabase.from('class_students').insert(enrollments)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/students/directory')
  return { success: true }
}
