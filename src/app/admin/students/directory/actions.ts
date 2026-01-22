'use server'

import { createClient } from '@/utils/supabase/server'
import { 
  StudentWithStats, 
  StudentDirectoryFilters, 
  TeacherStudentRpcResult,
  RawStudentData,
  NormalizedClassStudent 
} from '@/types/students'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { measureAsync } from '@/lib/performance'
import { getActiveTerm } from '@/utils/supabase/cached-queries'
import { logger } from '@/lib/logger'
import { uuidSchema } from '@/lib/schemas'

// Constants
const MAX_PAGE_SIZE = 100
const MAX_ENROLLED_IDS_LIMIT = 10000

export async function getDirectoryData(
  filters: StudentDirectoryFilters,
  page: number = 1,
  pageSize: number = 20,
  role: 'admin' | 'teacher',
  teacherId?: string
) {
  const route = role === 'teacher' ? '/teacher/students' : '/admin/students/directory'
  // Validate and limit page size to prevent abuse
  const validatedPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE)
  const validatedPage = Math.max(1, page)
  const from = (validatedPage - 1) * validatedPageSize
  const to = from + validatedPageSize - 1

  // Use cache for the actual data fetching
  const cacheKey = `students-directory-${role}-${teacherId || 'all'}-${JSON.stringify(filters)}-${page}`
  
  return unstable_cache(
    async () => {
      return measureAsync('Students Directory Data Fetch', async () => {
        // Use admin client for read-only queries (doesn't require cookies)
        const { createAdminClient } = await import('@/utils/supabase/admin')
        const supabase = createAdminClient()

        // 1. Get active term from cache
        const activeTerm = await getActiveTerm()
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

        // 3. Apply role-based filtering - use database function for teacher role
        if (role === 'teacher' && teacherId) {
          // Use database function to get students with stats in one query
          const rpcStartTime = Date.now()
          const { data: studentsWithStats, error: rpcError } = await supabase.rpc(
            'get_teacher_students_with_stats',
            {
              p_teacher_id: teacherId,
              p_term_id: activeTerm.id,
              p_page: page,
              p_page_size: pageSize,
              p_search: filters.search || null,
              p_year_group: filters.year_group || null,
              p_school: filters.school || null,
              p_class_id: filters.class_id || null,
            }
          )
          const rpcTime = Date.now() - rpcStartTime

          logger.performance('RPC Call', rpcTime, {
            hasData: !!studentsWithStats,
            dataLength: studentsWithStats?.length,
            error: rpcError?.message,
            usedRPC: !rpcError && studentsWithStats && studentsWithStats.length > 0
          })

          if (rpcError) {
            logger.error('RPC Failed:', rpcError)
            // Fallback to old method if RPC fails
          } else if (studentsWithStats && studentsWithStats.length > 0) {
            const totalCount = studentsWithStats[0]?.total_count || 0
            
            // RPC now includes class_students relationships, only need teacher profile
            const { data: teacherProfile } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('id', teacherId)
              .single()

            // Build students directly from RPC results (includes class_students as JSONB)
            let studentsWithFullStats: StudentWithStats[] = (studentsWithStats as TeacherStudentRpcResult[]).map((rpcRow) => {
              // Parse class_students JSONB from RPC
              const classStudents = (rpcRow.class_students || []).map((cs) => ({
                class: {
                  ...cs.class,
                  teacher: teacherProfile ? {
                    id: teacherProfile.id,
                    full_name: teacherProfile.full_name
                  } : undefined
                },
                course: cs.course
              }))
              
              return {
                id: rpcRow.student_id,
                name: rpcRow.student_name,
                year_group: rpcRow.year_group,
                school: rpcRow.school,
                class_students: classStudents,
                stats: {
                  total_grades: Number(rpcRow.total_grades || 0),
                  low_points: Number(rpcRow.low_points || 0),
                  flag_count: Number(rpcRow.flag_count || 0),
                  average_percentage: Number(rpcRow.avg_percentage || 0),
                  status: rpcRow.status
                }
              }
            })

            // Apply post-aggregation filters (performance and flags)
            if (filters.performance) {
              studentsWithFullStats = studentsWithFullStats.filter(s => {
                if (filters.performance === 'on_track') return s.stats.average_percentage >= 80
                if (filters.performance === 'at_risk') return s.stats.average_percentage >= 70 && s.stats.average_percentage < 80
                if (filters.performance === 'struggling') return s.stats.average_percentage < 70
                return true
              })
            }

            if (filters.flag_status) {
              studentsWithFullStats = studentsWithFullStats.filter(s => {
                if (filters.flag_status === 'none') return s.stats.flag_count === 0
                if (filters.flag_status === '1') return s.stats.flag_count === 1
                if (filters.flag_status === '2') return s.stats.flag_count === 2
                if (filters.flag_status === '3') return s.stats.flag_count === 3
                return true
              })
            }

            return {
              students: studentsWithFullStats,
              count: totalCount,
              activeTermId: activeTerm.id
            }
          }
          
          // If RPC returned no results or failed, return empty
          return { students: [], count: 0, activeTermId: activeTerm.id }
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

        // Filter by class if provided - optimized to use relation filter
        if (filters.class_id) {
          query = query.eq('class_students.class_id', filters.class_id)
        }

        // Enrollment status filter
        if (filters.enrollment_status === 'enrolled') {
          // Students with class_students entries are enrolled (already filtered by relation)
          // No additional query needed if we're already selecting class_students
        } else if (filters.enrollment_status === 'not_enrolled') {
          // For not enrolled, we need to exclude students with any class_students
          // This requires a separate query but we can optimize it
          const { data: enrolledIds } = await supabase
            .from('class_students')
            .select('student_id')
            .limit(MAX_ENROLLED_IDS_LIMIT)
          const ids = Array.from(new Set(enrolledIds?.map(s => s.student_id) || []))
          // Validate all IDs are valid UUIDs to prevent injection
          const validIds = ids.filter(id => uuidSchema.safeParse(id).success)
          if (validIds.length > 0) {
            // Use Supabase's proper array filtering - it handles parameterization safely
            query = query.not('id', 'in', `(${validIds.join(',')})`)
          }
        }

        const { data: studentsDataRaw, count, error: studentsError } = await query
          .order('name', { ascending: true })
          .range(from, to)

        if (studentsError) {
          return { students: [], count: 0, error: studentsError.message }
        }

        // Normalize the raw student data
        const studentsData = (studentsDataRaw || []).map((s: RawStudentData) => ({
          ...s,
          class_students: (s.class_students || []).map((cs): NormalizedClassStudent => ({
            class: Array.isArray(cs.class) ? (cs.class as NormalizedClassStudent['class'][])[0] : cs.class as NormalizedClassStudent['class'],
            course: Array.isArray(cs.course) ? (cs.course as NormalizedClassStudent['course'][])[0] : cs.course as NormalizedClassStudent['course'],
          }))
        }))

        // 5. Fetch additional data (grades and profiles for teachers)
        const studentIds = studentsData.map(s => s.id)
        
        // Get all teacher IDs from the classes
        const teacherIds = Array.from(new Set(
          studentsData.flatMap(s => s.class_students.map((cs) => cs.class?.teacher_id))
        )).filter((id): id is string => Boolean(id))

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

          const formattedClassStudents = student.class_students.map((cs) => {
            const teacherProfile = profilesData?.find(p => p.id === cs.class?.teacher_id)
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
      }, { route, role, page })
    },
    [cacheKey],
    {
      revalidate: 60, // 1 minute cache
      tags: ['students-directory', `role-${role}`, teacherId ? `teacher-${teacherId}` : 'all']
    }
  )()
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
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata.role !== 'admin') {
    return { error: 'Not authorized' }
  }

  // Validate all UUIDs
  const classIdValidation = uuidSchema.safeParse(classId)
  const courseIdValidation = uuidSchema.safeParse(courseId)
  if (!classIdValidation.success || !courseIdValidation.success) {
    return { error: 'Invalid class or course ID' }
  }

  const validStudentIds = studentIds.filter(id => uuidSchema.safeParse(id).success)
  if (validStudentIds.length === 0) {
    return { error: 'No valid student IDs provided' }
  }

  const enrollments = validStudentIds.map(studentId => ({
    student_id: studentId,
    class_id: classId,
    course_id: courseId
  }))

  const { error } = await supabase.from('class_students').insert(enrollments)

  if (error) {
    logger.error('Bulk enrollment failed:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/students/directory')
  return { success: true }
}
