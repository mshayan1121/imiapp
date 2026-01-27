'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Upload } from 'lucide-react'
import { InstructionsCard } from '@/app/admin/users/bulk-upload-teachers/_components/instructions-card'
import { FileUpload } from '@/app/admin/users/bulk-upload-teachers/_components/file-upload'
import { StatsCards } from '@/app/admin/users/bulk-upload-teachers/_components/stats-cards'
import { PreviewTable } from '@/app/admin/users/bulk-upload-teachers/_components/preview-table'
import { ResultsView } from '@/app/admin/users/bulk-upload-teachers/_components/results-view'
import { ConfirmationDialog } from '@/app/admin/users/bulk-upload-teachers/_components/confirmation-dialog'
import { ImportProgress } from '@/app/admin/users/bulk-upload-teachers/_components/import-progress'
import { ParsedTeacher, TeacherImportStats, ImportResult } from '@/app/admin/users/bulk-upload-teachers/_types'
import { checkExistingEmails, importTeacher, logImport } from '@/app/admin/users/bulk-upload-teachers/actions'
import Papa from 'papaparse'
// XLSX will be dynamically imported
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'

export function BulkUploadDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [teachers, setTeachers] = useState<ParsedTeacher[]>([])
  const [stats, setStats] = useState<TeacherImportStats>({
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
    setTeachers([])
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
      return // Prevent closing while importing
    }
    setOpen(newOpen)
    if (!newOpen) {
      // Optional: reset state on close or keep it? 
      // User might want to close and come back. But typically modals reset.
      // Let's reset if import was successful or if user just cancels.
      // For now, let's keep state unless explicitly reset, but maybe reset on re-open?
      // Better to reset on close to avoid stale state.
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
    const processedTeachers: ParsedTeacher[] = []
    const emailsToCheck: string[] = []

    rawData.forEach((row: any, index) => {
      const getCol = (key: string) => {
        const foundKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase())
        return foundKey ? row[foundKey] : ''
      }

      let firstName = String(getCol('first name') || getCol('firstname') || '').trim()
      let lastName = String(getCol('last name') || getCol('lastname') || '').trim()
      const fullNameCol = String(getCol('name') || getCol('full name') || getCol('fullname') || '').trim()

      // If first/last name are missing but name column exists, try to split it
      if ((!firstName || !lastName) && fullNameCol) {
        const parts = fullNameCol.split(/\s+/)
        if (parts.length >= 2) {
          if (!firstName) firstName = parts[0]
          if (!lastName) lastName = parts.slice(1).join(' ')
        } else if (parts.length === 1) {
          if (!firstName) firstName = parts[0]
        }
      }

      const email = String(getCol('email') || '').trim().toLowerCase()
      const status = String(getCol('status') || 'Active').trim()
      const isActive = status.toLowerCase() === 'active'

      if (!isActive) {
        inactiveCount++
        return
      }

      activeCount++

      processedTeachers.push({
        rowNumber: index + 2,
        firstName,
        lastName,
        email,
        status,
        fullName: `${firstName} ${lastName}`.trim(),
        validationStatus: 'new',
        errors: [],
        isDuplicate: false
      })

      if (email) emailsToCheck.push(email)
    })

    if (processedTeachers.length === 0) {
      if (totalInFile > 0) {
        toast.warning('No active teachers found in file')
      } else {
        throw new Error('File is empty')
      }
    }

    const existingEmails = await checkExistingEmails(emailsToCheck)
    const existingEmailSet = new Set(existingEmails.map(e => e.toLowerCase()))
    const seenEmails = new Set<string>()
    const fileDuplicateEmails = new Set<string>()
    
    processedTeachers.forEach(t => {
      if (t.email) {
        if (seenEmails.has(t.email)) {
          fileDuplicateEmails.add(t.email)
        }
        seenEmails.add(t.email)
      }
    })

    let newCount = 0
    let duplicateCount = 0
    let errorCount = 0

    processedTeachers.forEach(t => {
      const errors: string[] = []
      
      if (!t.firstName || t.firstName.length < 2) errors.push("First name missing or too short")
      if (!t.lastName || t.lastName.length < 2) errors.push("Last name missing or too short")
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!t.email) {
        errors.push("Email is required")
      } else if (!emailRegex.test(t.email)) {
        errors.push("Invalid email format")
      }

      let isDuplicate = false
      if (t.email) {
        if (existingEmailSet.has(t.email)) {
          isDuplicate = true
        }
      }
      t.isDuplicate = isDuplicate

      if (errors.length > 0) {
        t.validationStatus = 'error'
        t.errors = errors
        errorCount++
      } else if (isDuplicate) {
        t.validationStatus = 'duplicate'
        duplicateCount++
      } else {
        t.validationStatus = 'new'
        newCount++
      }
    })

    setTeachers(processedTeachers)
    setStats({
      totalInFile,
      activeCount,
      inactiveCount,
      newCount,
      duplicateCount,
      errorCount
    })
    
    const newIds = processedTeachers
      .filter(t => t.validationStatus === 'new')
      .map(t => t.rowNumber)
    setSelectedRows(new Set(newIds))
  }

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
    let password = ""
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleImportConfirm = async () => {
    setShowConfirm(false)
    setIsImporting(true)
    
    const teachersToImport = teachers.filter(t => selectedRows.has(t.rowNumber))
    const total = teachersToImport.length
    const successList: ImportResult['success'] = []
    const failedList: ImportResult['failed'] = []

    setImportProgress({ current: 0, total, currentName: 'Starting...' })

    for (let i = 0; i < total; i++) {
      const teacher = teachersToImport[i]
      setImportProgress({ 
        current: i + 1, 
        total, 
        currentName: teacher.fullName 
      })

      const tempPassword = generatePassword()
      
      const result = await importTeacher({
        email: teacher.email,
        fullName: teacher.fullName,
        password: tempPassword
      })

      if (result.success) {
        successList.push({
          fullName: teacher.fullName,
          email: teacher.email,
          tempPassword
        })
      } else {
        failedList.push({
          fullName: teacher.fullName,
          email: teacher.email,
          error: result.error || 'Unknown error'
        })
      }
    }

    await logImport({
      fileName: file?.name || 'unknown',
      totalRows: teachersToImport.length,
      successCount: successList.length,
      failedCount: failedList.length,
      results: { success: successList.map(s => s.email), failed: failedList }
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
          Bulk Upload Teachers
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[1400px] w-[95vw] h-[90vh] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <VisuallyHidden>
          <DialogTitle>Bulk Upload Teachers</DialogTitle>
        </VisuallyHidden>
        
        <div className="flex flex-col h-full">
          {/* Fixed Header */}
          <div className="p-6 pb-2 border-b">
            {showResults ? (
               <PageHeader 
                title="Import Results" 
                description="Review the outcome of your bulk upload."
              />
            ) : (
              <PageHeader 
                title="Bulk Upload Teachers" 
                description="Import teachers from ClassCard staff export (CSV or Excel)" 
              />
            )}
          </div>

          {/* Scrollable Content */}
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
              <ResultsView results={results} onReset={resetState} />
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
                      <StatsCards stats={stats} />
                    </div>
                    <PreviewTable 
                      teachers={teachers}
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
