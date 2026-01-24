// Single student gradebook types

export interface GradebookStudent {
  id: string
  name: string
  yearGroup?: string
}

export interface GradeEntry {
  id: string
  marksObtained: number
  totalMarks: number
  percentage: number
  workType: 'classwork' | 'homework'
  workSubtype: 'worksheet' | 'pastpaper'
  assessedDate: string
  isLowPoint: boolean
  attemptNumber: number
  isRetake: boolean
  isReassigned: boolean
  originalGradeId: string | null
  homeworkSubmitted: boolean | null // For homework status tracking
  notes?: string | null
  createdAt: string
}

export interface GradebookRow {
  id: string
  rowType: 'topic' | 'subtopic'
  topicId: string
  subtopicId: string | null
  name: string
  hasChildren: boolean
  parentTopicId?: string // For subtopics to track their parent
  grade: GradeEntry | null // Current/latest grade for this row
  allGrades: GradeEntry[] // All grades for trend view
}

export interface GradebookData {
  className: string
  courseName: string
  courseId: string
  studentName: string
  rows: GradebookRow[]
}

export interface GradebookFiltersState {
  classId: string
  studentId: string
  termId: string
  workTypeFilter: string
}

export interface SaveGradeInput {
  studentId: string
  classId: string
  courseId: string
  termId: string
  topicId: string
  subtopicId: string | null
  marksObtained: number
  totalMarks: number
  workType: 'classwork' | 'homework'
  workSubtype: 'worksheet' | 'pastpaper'
  assessedDate: string
  homeworkSubmitted?: boolean
  notes?: string
}

export interface UpdateGradeInput {
  marksObtained?: number
  totalMarks?: number
  workType?: 'classwork' | 'homework'
  workSubtype?: 'worksheet' | 'pastpaper'
  assessedDate?: string
  homeworkSubmitted?: boolean
  notes?: string
}

export interface ReassignHomeworkInput {
  gradeId: string
  newDeadline: string
  notes?: string
}

export interface AddRetakeInput {
  originalGradeId: string
  studentId: string
  classId: string
  courseId: string
  termId: string
  topicId: string
  subtopicId: string | null
  marksObtained: number
  totalMarks: number
  workType: 'classwork' | 'homework'
  workSubtype: 'worksheet' | 'pastpaper'
  assessedDate: string
}

export type WorkTypeOption = 'all' | 'classwork' | 'homework' | 'worksheet' | 'pastpaper'

export interface TrendData {
  date: string
  percentage: number
  attemptNumber: number
  workType: string
  isRetake: boolean
  isReassigned: boolean
}

export interface TrendStats {
  bestAttempt: number
  latestAttempt: number
  average: number
  totalAttempts: number
  retakeCount: number
}
