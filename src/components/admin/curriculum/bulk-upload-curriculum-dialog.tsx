'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { bulkUploadCurriculum } from '@/app/admin/curriculum/actions'
import Papa from 'papaparse'
// XLSX will be dynamically imported
import { toast } from 'sonner'

interface ParsedRow {
  rowNumber: number
  qualification: string
  board: string
  subject: string
  topic: string
  subtopic: string
  errors: string[]
}

export function BulkUploadCurriculumDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)

  const resetState = () => {
    setFile(null)
    setParsedRows([])
    setShowPreview(false)
    setUploadResults(null)
    setIsProcessing(false)
    setIsUploading(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(resetState, 300)
    }
  }

  const validateRow = (row: any, index: number): ParsedRow => {
    const errors: string[] = []
    
    if (!row.qualification?.trim()) {
      errors.push('Qualification is required')
    }
    if (!row.board?.trim()) {
      errors.push('Board is required')
    }
    if (!row.subject?.trim()) {
      errors.push('Subject is required')
    }
    // Topic and subtopic are optional

    return {
      rowNumber: index + 1,
      qualification: row.qualification?.trim() || '',
      board: row.board?.trim() || '',
      subject: row.subject?.trim() || '',
      topic: row.topic?.trim() || '',
      subtopic: row.subtopic?.trim() || '',
      errors,
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
        throw new Error('Unsupported file format. Please upload CSV or Excel file.')
      }

      // Normalize keys to handle case sensitivity and variations
      const normalizedData = rawData.map(row => {
        const newRow: any = {}
        Object.keys(row).forEach(key => {
          const lowerKey = key.toLowerCase().trim()
          // Handle various header formats (e.g. "Qualification", "Qualificati", "qualification")
          if (lowerKey.startsWith('qualificat')) newRow.qualification = row[key]
          else if (lowerKey === 'board') newRow.board = row[key]
          else if (lowerKey === 'subject') newRow.subject = row[key]
          else if (lowerKey === 'topic') newRow.topic = row[key]
          else if (lowerKey === 'subtopic') newRow.subtopic = row[key]
        })
        return newRow
      })

      // Validate and parse rows
      const validated = normalizedData.map((row, index) => validateRow(row, index))
      setParsedRows(validated)
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

  const handleUpload = async () => {
    const validRows = parsedRows.filter(row => row.errors.length === 0)
    
    if (validRows.length === 0) {
      toast.error('No valid rows to upload')
      return
    }

    setIsUploading(true)

    try {
      const result = await bulkUploadCurriculum(
        validRows.map(row => ({
          qualification: row.qualification,
          board: row.board,
          subject: row.subject,
          topic: row.topic,
          subtopic: row.subtopic,
        }))
      )

      if (result.error) {
        toast.error(result.error)
        return
      }

      setUploadResults(result.results)
      toast.success('Curriculum uploaded successfully!')
      router.refresh()
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const validRows = parsedRows.filter(row => row.errors.length === 0)
  const invalidRows = parsedRows.filter(row => row.errors.length > 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload Curriculum
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>Bulk Upload Curriculum</DialogTitle>
        <DialogDescription>
          Upload a CSV or Excel file to bulk import curriculum hierarchy (Qualification, Board, Subject, Topic, Subtopic)
        </DialogDescription>

        {!showPreview && !uploadResults && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>File Format</CardTitle>
                <CardDescription>
                  Your file should have the following columns (headers are case-insensitive):
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span><strong>Qualification</strong> (or 'Qualificati')</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span><strong>Board</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span><strong>Subject</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span><strong>Topic</strong> (optional)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span><strong>Subtopic</strong> (optional)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelect(e.target.files[0])
                      }
                    }}
                    className="hidden"
                    id="curriculum-file-upload"
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor="curriculum-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {isProcessing ? 'Processing...' : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500">
                      CSV or Excel files only (max 5MB)
                    </span>
                  </label>
                </div>
                {file && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null)
                        setParsedRows([])
                        setShowPreview(false)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {showPreview && !uploadResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Preview</h3>
                <p className="text-sm text-muted-foreground">
                  {validRows.length} valid rows, {invalidRows.length} rows with errors
                </p>
              </div>
              <Button onClick={handleUpload} disabled={isUploading || validRows.length === 0}>
                {isUploading ? 'Uploading...' : `Upload ${validRows.length} Rows`}
              </Button>
            </div>

            {invalidRows.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {invalidRows.length} row(s) have errors and will be skipped
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-96 overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Row</th>
                    <th className="p-2 text-left">Qualification</th>
                    <th className="p-2 text-left">Board</th>
                    <th className="p-2 text-left">Subject</th>
                    <th className="p-2 text-left">Topic</th>
                    <th className="p-2 text-left">Subtopic</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 50).map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.errors.length > 0 ? 'bg-red-50' : ''}
                    >
                      <td className="p-2">{row.rowNumber}</td>
                      <td className="p-2">{row.qualification}</td>
                      <td className="p-2">{row.board}</td>
                      <td className="p-2">{row.subject}</td>
                      <td className="p-2">{row.topic || '-'}</td>
                      <td className="p-2">{row.subtopic || '-'}</td>
                      <td className="p-2">
                        {row.errors.length > 0 ? (
                          <span className="text-red-600 text-xs">
                            {row.errors.join(', ')}
                          </span>
                        ) : (
                          <span className="text-green-600 text-xs">Valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 50 && (
                <div className="p-2 text-xs text-muted-foreground text-center">
                  Showing first 50 rows. All rows will be processed on upload.
                </div>
              )}
            </div>
          </div>
        )}

        {uploadResults && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Upload completed! Check the results below.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadResults.qualifications.created}</div>
                  <div className="text-xs text-muted-foreground">
                    {uploadResults.qualifications.existing} already existed
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Boards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadResults.boards.created}</div>
                  <div className="text-xs text-muted-foreground">
                    {uploadResults.boards.existing} already existed
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadResults.subjects.created}</div>
                  <div className="text-xs text-muted-foreground">
                    {uploadResults.subjects.existing} already existed
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadResults.topics.created}</div>
                  <div className="text-xs text-muted-foreground">
                    {uploadResults.topics.existing} already existed
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Subtopics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadResults.subtopics.created}</div>
                  <div className="text-xs text-muted-foreground">
                    {uploadResults.subtopics.existing} already existed
                  </div>
                </CardContent>
              </Card>
            </div>

            {uploadResults.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-red-600">Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    {uploadResults.errors.map((err: any, idx: number) => (
                      <div key={idx} className="text-red-600">
                        Row {err.row}: {err.error}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={() => handleOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
