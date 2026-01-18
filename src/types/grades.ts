export interface Term {
  id: string
  name: string
  is_active: boolean
}

export interface Class {
  id: string
  name: string
}

export interface Student {
  id: string
  name: string
  year_group?: string
  school?: string
}

export interface Course {
  id: string
  name: string
  qualification_id?: string
  board_id?: string
  subject_id?: string
}

export interface Topic {
  id: string
  name: string
}

export interface Subtopic {
  id: string
  name: string
}

export interface Grade {
  id: string
  student_id: string
  class_id: string
  course_id: string
  term_id: string
  topic_id: string
  subtopic_id: string | null
  work_type: 'classwork' | 'homework'
  work_subtype: 'worksheet' | 'pastpaper'
  marks_obtained: number
  total_marks: number
  percentage: number
  is_low_point: boolean
  attempt_number: number
  notes?: string
  assessed_date: string
  entered_by: string
  created_at: string
  updated_at: string
  students?: Student
  classes?: Class
  courses?: Course
  topics?: Topic
  subtopics?: Subtopic
}

export interface GradeFiltersState {
  class_id: string
  term_id: string
  student_id: string
  work_type: string
  topic_id: string
  subtopic_id: string
  page?: number
  limit?: number
}

export interface StudentProgressSummary {
  student_id: string
  student_name: string
  year_group: string
  course_name: string
  total_grades: number
  low_points: number
  average_percentage: number
  flag_count: number
  status: string
}

export interface ParentContact {
  id: string
  student_id: string
  term_id: string
  contact_type: 'message' | 'call' | 'meeting'
  status: 'pending' | 'contacted' | 'resolved'
  notes?: string
  contacted_at?: string
}
