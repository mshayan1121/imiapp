export interface ParsedStudent {
  rowNumber: number
  fullName: string
  yearGroup: string
  school: string
  email: string
  phone: string
  guardianName: string
  status: string
  validationStatus: 'new' | 'duplicate' | 'error'
  errors: string[]
  isDuplicate: boolean
}

export interface StudentImportStats {
  totalInFile: number
  activeCount: number
  inactiveCount: number
  newCount: number
  duplicateCount: number
  errorCount: number
}

export interface ImportResult {
  success: Array<{
    fullName: string
    email: string
  }>
  failed: Array<{
    fullName: string
    email: string
    error: string
  }>
}
