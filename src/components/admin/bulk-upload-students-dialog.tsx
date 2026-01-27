'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Upload } from 'lucide-react'
import { InstructionsCard } from '@/app/admin/students/bulk-upload/_components/instructions-card'
import { FileUpload } from '@/app/admin/students/bulk-upload/_components/file-upload'
import { StatsCards } from '@/app/admin/students/bulk-upload/_components/stats-cards'
import { PreviewTable } from '@/app/admin/students/bulk-upload/_components/preview-table'
import { ResultsView } from '@/app/admin/students/bulk-upload/_components/results-view'
import { ConfirmationDialog } from '@/app/admin/students/bulk-upload/_components/confirmation-dialog'
import { ImportProgress } from '@/app/admin/students/bulk-upload/_components/import-progress'
import { ParsedStudent, StudentImportStats, ImportResult } from '@/app/admin/students/bulk-upload/_types'
import { checkExistingStudents, importStudent, logImport } from '@/app/admin/students/bulk-upload/actions'
import Papa from 'papaparse'
// XLSX will be dynamically imported
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'

export function BulkUploadStudentsDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [students, setStudents] = useState<ParsedStudent[]>([])
  const [stats, setStats] = useState<StudentImportStats>({
    totalInFile: 0,
    activeCount: 0,
    inactiveCount: 0,
    newCount: 0,
    duplicateCount: 0,
    errorCount: 0,
  })
  const [showPreview, setShowPreview] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<ImportResult>({ success: [], failed: [] })
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentName: '' })

  const resetState = () => {
    setFile(null)
    setStudents([])
    setShowPreview(false)
    setShowResults(false)
    setResults({ success: [], failed: [] })
    setSelectedRows(new Set())
    setStats({
      totalInFile: 0,
      activeCount: 0,
      inactiveCount: 0,
      newCount: 0,
      duplicateCount: 0,
      errorCount: 0,
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isImporting) {
      return
    }
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(resetState, 300)
    }
  }

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    setIsProcessing(true)

    try {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase()
      let rawData: any[] = []

      if (extension === 'csv') {
        rawData = await parseCSV(selectedFile)
      } else if (['xls', 'xlsx'].includes(extension || '')) {
        rawData = await parseExcel(selectedFile)
      } else {
        throw new Error('Unsupported file format')
      }

      await processParsedData(rawData)
      setShowPreview(true)
    } catch (error: any) {
      toast.error('Error parsing file: ' + error.message)
      console.error(error)
      setFile(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      })
    })
  }

  const parseExcel = async (file: File): Promise<any[]> => {
    // Dynamically import xlsx only when needed
    const XLSX = await import('xlsx')
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(sheet)
          resolve(json)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = (error) => reject(error)
      reader.readAsBinaryString(file)
    })
  }

  const processParsedData = async (rawData: any[]) => {
    const totalInFile = rawData.length
    let activeCount = 0
    let inactiveCount = 0
    const processedStudents: ParsedStudent[] = []
    const namesToCheck: string[] = []

    rawData.forEach((row: any, index) => {
      const getCol = (key: string) => {
        const foundKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase())
        return foundKey ? row[foundKey] : ''
      }

      const fullName = String(getCol('name') || getCol('full name') || getCol('fullname') || '').trim()
      let yearGroup = String(getCol('school year') || getCol('year group') || getCol('year') || getCol('yeargroup') || '').trim()
      const school = String(getCol('school') || getCol('school name') || getCol('institution') || '').trim()
      
      // Parse "Year 12/Grade 11" format to just "Year 12"
      if (yearGroup.includes('/')) {
        yearGroup = yearGroup.split('/')[0].trim()
      }

      const email = String(getCol('email') || '').trim().toLowerCase()
      const phone = String(getCol('phone') || getCol('contact') || getCol('mobile') || '').trim()
      const guardianName = String(getCol('guardian name') || getCol('parent name') || getCol('guardian') || '').trim()
      const status = String(getCol('status') || 'Active').trim()
      
      const isActive = status.toLowerCase() === 'active'

      if (!isActive) {
        inactiveCount++
        return
      }

      activeCount++

      processedStudents.push({
        rowNumber: index + 2,
        fullName,
        yearGroup,
        school,
        email,
        phone,
        guardianName,
        status,
        validationStatus: 'new',
        errors: [],
        isDuplicate: false
      })

      if (fullName) namesToCheck.push(fullName)
    })

    if (processedStudents.length === 0) {
      if (totalInFile > 0) {
        toast.warning('No active students found in file')
      } else {
        throw new Error('File is empty')
      }
    }

    const existingNames = await checkExistingStudents(namesToCheck)
    const existingNameSet = new Set(existingNames.map(n => n.toLowerCase()))
    
    let newCount = 0
    let duplicateCount = 0
    let errorCount = 0

    processedStudents.forEach(s => {
      const errors: string[] = []
      
      if (!s.fullName || s.fullName.length < 2) errors.push("Name missing or too short")
      
      let isDuplicate = false
      if (s.fullName && existingNameSet.has(s.fullName.toLowerCase())) {
        isDuplicate = true
      }
      s.isDuplicate = isDuplicate

      if (errors.length > 0) {
        s.validationStatus = 'error'
        s.errors = errors
        errorCount++
      } else if (isDuplicate) {
        s.validationStatus = 'duplicate'
        duplicateCount++
      } else {
        s.validationStatus = 'new'
        newCount++
      }
    })

    setStudents(processedStudents)
    setStats({
      totalInFile,
      activeCount,
      inactiveCount,
      newCount,
      duplicateCount,
      errorCount
    })
    
    // Default to empty selection so users can use the Year Group filters
    setSelectedRows(new Set())
  }

  const handleImportConfirm = async () => {
    setShowConfirm(false)
    setIsImporting(true)
    
    const studentsToImport = students.filter(s => selectedRows.has(s.rowNumber))
    const total = studentsToImport.length
    const successList: ImportResult['success'] = []
    const failedList: ImportResult['failed'] = []

    setImportProgress({ current: 0, total, currentName: 'Starting...' })

    for (let i = 0; i < total; i++) {
      const student = studentsToImport[i]
      setImportProgress({ 
        current: i + 1, 
        total, 
        currentName: student.fullName 
      })

      const result = await importStudent({
        fullName: student.fullName,
        yearGroup: student.yearGroup,
        school: student.school,
        email: student.email,
        phone: student.phone,
        guardianName: student.guardianName
      })

      if (result.success) {
        successList.push({
          fullName: student.fullName,
          email: student.email
        })
      } else {
        failedList.push({
          fullName: student.fullName,
          email: student.email,
          error: result.error || 'Unknown error'
        })
      }
    }

    await logImport({
      fileName: file?.name || 'unknown',
      totalRows: studentsToImport.length,
      successCount: successList.length,
      failedCount: failedList.length,
      results: { success: successList.map(s => s.fullName), failed: failedList }
    })

    setResults({ success: successList, failed: failedList })
    setIsImporting(false)
    setShowResults(true)
    setShowPreview(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload Students
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[1400px] w-[95vw] h-[90vh] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <VisuallyHidden>
          <DialogTitle>Bulk Upload Students</DialogTitle>
        </VisuallyHidden>
        
        <div className="flex flex-col h-full">
          <div className="p-6 pb-2 border-b">
            {showResults ? (
               <PageHeader 
                title="Import Results" 
                description="Review the outcome of your bulk upload."
              />
            ) : (
              <PageHeader 
                title="Bulk Upload Students" 
                description="Import students from ClassCard export (CSV or Excel)" 
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {isImporting && (
              <div className="mb-6">
                <ImportProgress 
                  current={importProgress.current} 
                  total={importProgress.total} 
                  currentName={importProgress.currentName} 
                />
              </div>
            )}

            <ConfirmationDialog 
              open={showConfirm} 
              onOpenChange={setShowConfirm}
              onConfirm={handleImportConfirm}
              count={selectedRows.size}
            />

            {showResults ? (
              <ResultsView 
                results={results} 
                onReset={resetState} 
                onClose={() => {
                  setOpen(false)
                  router.refresh()
                }}
              />
            ) : (
              <div className="space-y-6">
                {!showPreview && (
                  <>
                    <Section>
                      <InstructionsCard />
                    </Section>
                    <Section title="Upload File">
                      <FileUpload 
                        onFileSelect={handleFileSelect} 
                        isProcessing={isProcessing} 
                      />
                    </Section>
                  </>
                )}

                {showPreview && (
                  <Section title="Preview & Review">
                    <div className="mb-6">
                      <StatsCards stats={stats} selectedCount={selectedRows.size} />
                    </div>
                    <PreviewTable 
                      students={students}
                      stats={stats}
                      selectedRows={selectedRows}
                      onSelectionChange={setSelectedRows}
                      onReset={resetState}
                      onImport={() => setShowConfirm(true)}
                      isImporting={isImporting}
                    />
                  </Section>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
