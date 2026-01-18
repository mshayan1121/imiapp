export interface ParsedTeacher {
  rowNumber: number
  firstName: string
  lastName: string
  email: string
  status: string
  fullName: string
  validationStatus: 'new' | 'duplicate' | 'error'
  errors: string[]
  isDuplicate: boolean
}

export interface TeacherImportStats {
  totalInFile: number
  activeCount: number
  inactiveCount: number
  newCount: number
  duplicateCount: number
  errorCount: number
}

export interface ImportResult {
  success: {
    fullName: string
    email: string
    tempPassword: string
  }[]
  failed: {
    fullName: string
    email: string
    error: string
  }[]
}
