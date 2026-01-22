import { Student } from './grades'

export interface ClassStudentRelation {
  class: {
    id: string
    name: string
    teacher_id?: string
    teacher?: {
      id: string
      full_name: string
    }
  }
  course: {
    id: string
    name: string
  }
}

export interface StudentStats {
  total_grades: number
  low_points: number
  flag_count: number
  average_percentage: number
  status: 'On Track' | 'At Risk' | 'Struggling'
}

export interface StudentWithStats extends Student {
  class_students: ClassStudentRelation[]
  stats: StudentStats
}

export interface StudentDirectoryFilters {
  search: string
  year_group: string
  school: string
  class_id: string
  course_id: string
  enrollment_status: string
  performance: string
  flag_status: string
}

/**
 * Result from the get_teacher_students_with_stats RPC function
 */
export interface TeacherStudentRpcResult {
  student_id: string
  student_name: string
  year_group: string
  school: string
  total_grades: number
  low_points: number
  avg_percentage: number
  flag_count: number
  status: 'On Track' | 'At Risk' | 'Struggling'
  total_count: number
  class_students: Array<{
    class: {
      id: string
      name: string
      teacher_id: string
    }
    course: {
      id: string
      name: string
    }
  }>
}

/**
 * Raw student data from Supabase query (before transformation)
 */
export interface RawStudentData {
  id: string
  name: string
  year_group: string
  school: string
  class_students: Array<{
    class: unknown
    course: unknown
  }>
}

/**
 * Normalized class student from raw query
 */
export interface NormalizedClassStudent {
  class: {
    id: string
    name: string
    teacher_id?: string
  }
  course: {
    id: string
    name: string
  }
}
