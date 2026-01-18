import { Student, Grade } from './grades'

export interface StudentWithStats extends Student {
  class_students: Array<{
    class: {
      id: string
      name: string
      teacher?: {
        id: string
        full_name: string
      }
    }
    course: {
      id: string
      name: string
    }
  }>
  stats: {
    total_grades: number
    low_points: number
    flag_count: number
    average_percentage: number
    status: 'On Track' | 'At Risk' | 'Struggling'
  }
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
