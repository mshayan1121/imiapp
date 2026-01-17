'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, ChevronLeft, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import {
  getTeacherData,
  getClassDetails,
  getCourseContent,
  getSubtopics,
  getActiveTerm,
  submitGrades,
  checkExistingGrades,
  deleteGrade,
} from '../actions'
import { LowPointBadge } from './lp-badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface EntryRow {
  id: string
  student_id: string
  course_id: string
  topic_id: string
  subtopic_id: string
  work_type: 'classwork' | 'homework'
  work_subtype: 'worksheet' | 'pastpaper'
  marks_obtained: number | ''
  total_marks: number
  assessed_date: Date
  topics: any[]
  subtopics: any[]
}

export function IndividualEntry() {
  const [step, setStep] = useState(1)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [students, setStudents] = useState<any[]>([])
  const [activeTerm, setActiveTerm] = useState<any>(null)
  const [rows, setRows] = useState<EntryRow[]>([])
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [retakeDialogOpen, setRetakeDialogOpen] = useState(false)
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([])
  const [retakeData, setRetakeData] = useState<{
    studentId: string
    existingGrades: any[]
    newGrade: any
    rowIndex: number
  } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true)
        const { classes } = await getTeacherData()
        const term = await getActiveTerm()
        setClasses(classes || [])
        setActiveTerm(term)
      } catch (error) {
        toast.error('Failed to load initial data')
      } finally {
        setInitialLoading(false)
      }
    }
    fetchData()
  }, [])

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full max-w-md" />
      </div>
    )
  }

  const onClassSelect = async (classId: string) => {
    setSelectedClassId(classId)
    try {
      const { students } = await getClassDetails(classId)
      setStudents(students || [])
      setStep(2)
      // Add initial row
      addRow()
    } catch (error) {
      toast.error('Failed to load class details')
    }
  }

  const addRow = () => {
    const newRow: EntryRow = {
      id: Math.random().toString(36).substr(2, 9),
      student_id: '',
      course_id: '',
      topic_id: '',
      subtopic_id: '',
      work_type: 'classwork',
      work_subtype: 'worksheet',
      marks_obtained: '',
      total_marks: 10,
      assessed_date: new Date(),
      topics: [],
      subtopics: [],
    }
    setRows([...rows, newRow])
  }

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      toast.error('At least one row is required')
      return
    }
    setRows(rows.filter((row) => row.id !== id))
  }

  const updateRow = async (id: string, updates: Partial<EntryRow>) => {
    const updatedRows = await Promise.all(
      rows.map(async (row) => {
        if (row.id === id) {
          const newRow = { ...row, ...updates }

          // Cascade changes
          if (updates.student_id) {
            const student = students.find((s) => s.student_id === updates.student_id)
            newRow.course_id = student?.course_id || ''
            const { topics } = await getCourseContent(newRow.course_id)
            newRow.topics = topics || []
            newRow.topic_id = ''
            newRow.subtopic_id = ''
            newRow.subtopics = []
          }

          if (updates.topic_id) {
            const { subtopics } = await getSubtopics(updates.topic_id)
            newRow.subtopics = subtopics || []
            newRow.subtopic_id = ''
          }

          return newRow
        }
        return row
      }),
    )
    setRows(updatedRows)
  }

  const handleSubmit = async () => {
    if (!activeTerm) {
      toast.error('No active academic term found. Please contact admin.')
      return
    }
    // Validate rows
    const invalidRow = rows.find(
      (r) =>
        !r.student_id || !r.course_id || !r.topic_id || !r.subtopic_id || r.marks_obtained === '',
    )

    if (invalidRow) {
      toast.error('Please fill in all fields for each row')
      return
    }

    const entries = rows.map((r) => {
      const marks = r.marks_obtained as number
      const percentage = (marks / r.total_marks) * 100
      return {
        student_id: r.student_id,
        class_id: selectedClassId,
        course_id: r.course_id,
        term_id: activeTerm.id,
        topic_id: r.topic_id,
        subtopic_id: r.subtopic_id,
        work_type: r.work_type,
        work_subtype: r.work_subtype,
        marks_obtained: marks,
        total_marks: r.total_marks,
        percentage: Math.round(percentage * 100) / 100,
        is_low_point: percentage < 80,
        assessed_date: format(r.assessed_date, 'yyyy-MM-dd'),
        attempt_number: 1,
      }
    })

    setPendingSubmissions(entries)
    setConfirmDialogOpen(true)
  }

  const processSubmission = async (entries: any[]) => {
    setLoading(true)
    try {
      const finalEntries = []

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const existing = await checkExistingGrades({
          student_id: entry.student_id,
          class_id: entry.class_id,
          course_id: entry.course_id,
          term_id: entry.term_id,
          topic_id: entry.topic_id,
          subtopic_id: entry.subtopic_id,
        })

        if (existing && existing.length > 0) {
          setRetakeData({
            studentId: entry.student_id,
            existingGrades: existing,
            newGrade: entry,
            rowIndex: i,
          })
          setRetakeDialogOpen(true)
          setLoading(false)
          return
        } else {
          finalEntries.push(entry)
        }
      }

      if (finalEntries.length > 0) {
        await submitGrades(finalEntries)
        toast.success(`${finalEntries.length} individual grades entered`)
        window.location.reload()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit grades')
    } finally {
      setLoading(false)
    }
  }

  const handleRetakeOption = async (option: 'replace' | 'retake') => {
    if (!retakeData) return
    setLoading(true)
    setRetakeDialogOpen(false)

    try {
      const { newGrade, existingGrades } = retakeData

      if (option === 'replace') {
        for (const g of existingGrades) {
          await deleteGrade(g.id)
        }
        await submitGrades([{ ...newGrade, attempt_number: 1 }])
      } else {
        const maxAttempt = Math.max(...existingGrades.map((g) => g.attempt_number))
        await submitGrades([{ ...newGrade, attempt_number: maxAttempt + 1 }])
      }

      const remaining = pendingSubmissions.slice(retakeData.rowIndex + 1)
      setPendingSubmissions(remaining)

      if (remaining.length > 0) {
        await processSubmission(remaining)
      } else {
        toast.success('Grade entry completed')
        window.location.reload()
      }
    } catch (error: any) {
      toast.error(error.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle>Select Class for Individual Entry</CardTitle>
        </CardHeader>
        <CardContent className="px-0 max-w-md">
          <Select onValueChange={onClassSelect} value={selectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Step 2: Add Individual Entries</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Class: {classes.find((c) => c.id === selectedClassId)?.name}
          </p>
        </div>
        <Button variant="outline" onClick={() => setStep(1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Change Class
        </Button>
      </CardHeader>

      <CardContent className="px-0 overflow-x-auto">
        <div className="min-w-[1200px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Student</TableHead>
                <TableHead className="w-[180px]">Topic</TableHead>
                <TableHead className="w-[180px]">Subtopic</TableHead>
                <TableHead className="w-[130px]">Type / Sub</TableHead>
                <TableHead className="w-[100px]">Marks</TableHead>
                <TableHead className="w-[100px]">Total</TableHead>
                <TableHead className="w-[150px]">Date</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const percentage =
                  row.marks_obtained !== '' ? (row.marks_obtained / row.total_marks) * 100 : 0
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Select
                        value={row.student_id}
                        onValueChange={(val) => updateRow(row.id, { student_id: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((s) => (
                            <SelectItem key={s.student_id} value={s.student_id}>
                              {s.students.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.topic_id}
                        onValueChange={(val) => updateRow(row.id, { topic_id: val })}
                        disabled={!row.student_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {row.topics.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.subtopic_id}
                        onValueChange={(val) => updateRow(row.id, { subtopic_id: val })}
                        disabled={!row.topic_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Subtopic" />
                        </SelectTrigger>
                        <SelectContent>
                          {row.subtopics.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Select
                          value={row.work_type}
                          onValueChange={(val: any) => updateRow(row.id, { work_type: val })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classwork">Classwork</SelectItem>
                            <SelectItem value="homework">Homework</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={row.work_subtype}
                          onValueChange={(val: any) => updateRow(row.id, { work_subtype: val })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="worksheet">Worksheet</SelectItem>
                            <SelectItem value="pastpaper">Past Paper</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.marks_obtained}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                          if (val !== '' && val > row.total_marks) {
                            toast.error('Marks cannot exceed total')
                            return
                          }
                          updateRow(row.id, { marks_obtained: val as any })
                        }}
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.total_marks}
                        onChange={(e) =>
                          updateRow(row.id, { total_marks: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="10"
                      />
                    </TableCell>
                    <TableCell>
                      <DatePicker
                        date={row.assessed_date}
                        setDate={(date) => updateRow(row.id, { assessed_date: date || new Date() })}
                      />
                    </TableCell>
                    <TableCell>
                      {row.marks_obtained !== '' && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium">{percentage.toFixed(1)}%</span>
                          <LowPointBadge percentage={percentage} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={addRow} className="w-full max-w-xs border-dashed">
            <Plus className="mr-2 h-4 w-4" />
            Add Another Student
          </Button>
        </div>
      </CardContent>

      <CardFooter className="px-0 flex justify-end mt-6">
        <Button onClick={handleSubmit} loading={loading} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Submit All Grades
        </Button>
      </CardFooter>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Review Individual Entries</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to save {rows.length} grade entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[300px] overflow-y-auto my-4 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subtopic</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">
                      {students.find((s) => s.student_id === r.student_id)?.students.name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.subtopics.find((s) => s.id === r.subtopic_id)?.name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.marks_obtained} / {r.total_marks}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDialogOpen(false)
                processSubmission(pendingSubmissions)
              }}
            >
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Retake Dialog */}
      <AlertDialog open={retakeDialogOpen} onOpenChange={setRetakeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Existing Grade Found</AlertDialogTitle>
            <AlertDialogDescription>
              {students.find((s) => s.student_id === retakeData?.studentId)?.students.name} already
              has a grade for this subtopic this term.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              disabled={loading}
              onClick={() => {
                setRetakeDialogOpen(false)
                if (!retakeData) return
                const remaining = pendingSubmissions.slice(retakeData.rowIndex + 1)
                setPendingSubmissions(remaining)
                if (remaining.length > 0) processSubmission(remaining)
              }}
            >
              Skip Student
            </AlertDialogCancel>
            <Button
              variant="outline"
              loading={loading}
              onClick={() => handleRetakeOption('replace')}
            >
              Replace Old Grade
            </Button>
            <Button loading={loading} onClick={() => handleRetakeOption('retake')}>
              Add as Retake
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
