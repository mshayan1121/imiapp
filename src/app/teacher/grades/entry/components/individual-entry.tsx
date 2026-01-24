'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, ChevronLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
} from '../actions'
import { LowPointBadge } from './lp-badge'
import { Skeleton } from '@/components/ui/skeleton'

interface EntryRow {
  id: string
  student_id: string
  course_id: string
  topic_id: string
  subtopic_id: string
  work_type: 'classwork' | 'homework'
  work_subtype: 'worksheet' | 'pastpaper'
  marks_obtained: number | string
  total_marks: number | string
  assessed_date: Date
  topics: any[]
  subtopics: any[]
  is_retake: boolean
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
      is_retake: false,
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
    // 1. Update state immediately for non-async fields
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)))

    // 2. Handle async side effects
    if (updates.student_id) {
      try {
        const student = students.find((s) => s.student_id === updates.student_id)
        const courseId = student?.course_id || ''
        const { topics } = await getCourseContent(courseId)
        setRows((prev) =>
          prev.map((row) =>
            row.id === id
              ? {
                  ...row,
                  course_id: courseId,
                  topics: topics || [],
                  topic_id: '',
                  subtopic_id: '',
                  subtopics: [],
                }
              : row,
          ),
        )
      } catch (error) {
        toast.error('Failed to load topics')
      }
    }

    if (updates.topic_id) {
      try {
        const { subtopics } = await getSubtopics(updates.topic_id)
        setRows((prev) =>
          prev.map((row) =>
            row.id === id
              ? {
                  ...row,
                  subtopics: subtopics || [],
                  subtopic_id: '',
                }
              : row,
          ),
        )
      } catch (error) {
        toast.error('Failed to load subtopics')
      }
    }
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
      const marks = parseFloat(r.marks_obtained.toString())
      const total = parseFloat(r.total_marks.toString())
      const percentage = (marks / total) * 100
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
        total_marks: total,
        percentage: Math.round(percentage * 100) / 100,
        is_low_point: percentage < 80,
        assessed_date: format(r.assessed_date, 'yyyy-MM-dd'),
        is_retake: r.is_retake,
      }
    })

    processSubmission(entries)
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

        if (entry.is_retake) {
          if (!existing || existing.length === 0) {
            toast.error('No existing grade found for retake. Uncheck retake to add a first attempt.')
            setLoading(false)
            return
          }
          const maxAttempt = Math.max(...existing.map((g) => g.attempt_number))
          finalEntries.push({
            ...entry,
            attempt_number: maxAttempt + 1,
            is_retake: true,
            is_reassigned: false,
            original_grade_id: existing[0]?.id || null,
          })
        } else {
          if (existing && existing.length > 0) {
            toast.error('Existing grade found. Check retake to add another attempt.')
            setLoading(false)
            return
          }
          finalEntries.push({
            ...entry,
            attempt_number: 1,
            is_retake: false,
            is_reassigned: false,
            original_grade_id: null,
          })
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

      <CardContent className="px-0">
        {/* Mobile View */}
        <div className="md:hidden space-y-4 px-4">
          {rows.map((row) => {
            const percentage =
              row.marks_obtained !== '' && row.total_marks !== ''
                ? (parseFloat(row.marks_obtained.toString()) / parseFloat(row.total_marks.toString())) * 100
                : 0
            return (
              <Card key={row.id} className="p-4 space-y-4 border border-gray-200 shadow-sm">
                <div className="space-y-4">
                  {/* Student */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Student</label>
                    <Select
                      value={row.student_id}
                      onValueChange={(val) => updateRow(row.id, { student_id: val })}
                    >
                      <SelectTrigger className="w-full bg-white text-gray-900 border-gray-200">
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
                  </div>

                  {/* Topic */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Topic</label>
                    <Select
                      value={row.topic_id}
                      onValueChange={(val) => updateRow(row.id, { topic_id: val })}
                      disabled={!row.student_id}
                    >
                      <SelectTrigger className="w-full bg-white text-gray-900 border-gray-200">
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
                  </div>

                  {/* Subtopic */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Subtopic</label>
                    <Select
                      value={row.subtopic_id}
                      onValueChange={(val) => updateRow(row.id, { subtopic_id: val })}
                      disabled={!row.topic_id}
                    >
                      <SelectTrigger className="w-full bg-white text-gray-900 border-gray-200">
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
                  </div>

                  {/* Type / Subtype */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Type</label>
                      <Select
                        value={row.work_type}
                        onValueChange={(val: any) => updateRow(row.id, { work_type: val })}
                      >
                        <SelectTrigger className="w-full bg-white text-gray-900 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classwork">Classwork</SelectItem>
                          <SelectItem value="homework">Homework</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Subtype</label>
                      <Select
                        value={row.work_subtype}
                        onValueChange={(val: any) => updateRow(row.id, { work_subtype: val })}
                      >
                        <SelectTrigger className="w-full bg-white text-gray-900 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="worksheet">Worksheet</SelectItem>
                          <SelectItem value="pastpaper">Past Paper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Retake */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Retake</label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={row.is_retake}
                        onCheckedChange={(checked) =>
                          updateRow(row.id, { is_retake: checked === true })
                        }
                      />
                      <span className="text-sm text-gray-700">Mark as retake</span>
                    </div>
                  </div>

                  {/* Marks / Total */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Marks</label>
                      <Input
                        type="number"
                        value={row.marks_obtained}
                        onChange={(e) => {
                          const val = e.target.value
                          if (
                            val !== '' &&
                            parseFloat(val) > (parseFloat(row.total_marks.toString()) || 0)
                          ) {
                            toast.error('Marks cannot exceed total')
                            return
                          }
                          updateRow(row.id, { marks_obtained: val })
                        }}
                        placeholder="0"
                        className="bg-white text-gray-900 border-gray-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Total</label>
                      <Input
                        type="number"
                        value={row.total_marks}
                        onChange={(e) => updateRow(row.id, { total_marks: e.target.value })}
                        placeholder="10"
                        className="bg-white text-gray-900 border-gray-200"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Date</label>
                    <div className="w-full">
                      <DatePicker
                        date={row.assessed_date}
                        setDate={(date) => updateRow(row.id, { assessed_date: date || new Date() })}
                      />
                    </div>
                  </div>

                  {/* Status & Remove */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {row.marks_obtained !== '' && (
                        <>
                          <span className="text-sm font-medium text-gray-900">
                            {percentage.toFixed(1)}%
                          </span>
                          <LowPointBadge percentage={percentage} />
                        </>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeRow(row.id)}
                      className="w-full max-w-[100px]"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto border rounded-lg bg-white/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Student</TableHead>
                <TableHead className="w-[250px]">Topic</TableHead>
                <TableHead className="w-[250px]">Subtopic</TableHead>
                <TableHead className="w-[140px]">Type / Sub</TableHead>
                <TableHead className="w-[80px] text-center">Marks</TableHead>
                <TableHead className="w-[80px] text-center">Total</TableHead>
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead className="w-[90px] text-center">Retake</TableHead>
                <TableHead className="w-[120px] text-center">Status</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const percentage =
                  row.marks_obtained !== '' && row.total_marks !== ''
                    ? (parseFloat(row.marks_obtained.toString()) /
                        parseFloat(row.total_marks.toString())) *
                      100
                    : 0
                return (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Select
                        value={row.student_id}
                        onValueChange={(val) => updateRow(row.id, { student_id: val })}
                      >
                        <SelectTrigger className="bg-white text-gray-900 border-gray-200">
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
                        <SelectTrigger className="bg-white text-gray-900 border-gray-200">
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
                        <SelectTrigger className="bg-white text-gray-900 border-gray-200">
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
                          <SelectTrigger className="h-8 text-[10px] bg-white text-gray-900 border-gray-200 px-2">
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
                          <SelectTrigger className="h-8 text-[10px] bg-white text-gray-900 border-gray-200 px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="worksheet">Worksheet</SelectItem>
                            <SelectItem value="pastpaper">Past Paper</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="px-1">
                      <Input
                        type="number"
                        value={row.marks_obtained}
                        onChange={(e) => {
                          const val = e.target.value
                          if (
                            val !== '' &&
                            parseFloat(val) > (parseFloat(row.total_marks.toString()) || 0)
                          ) {
                            toast.error('Marks cannot exceed total')
                            return
                          }
                          updateRow(row.id, { marks_obtained: val })
                        }}
                        placeholder="0"
                        className="bg-white text-gray-900 border-gray-200 text-center px-1"
                      />
                    </TableCell>
                    <TableCell className="px-1">
                      <Input
                        type="number"
                        value={row.total_marks}
                        onChange={(e) => updateRow(row.id, { total_marks: e.target.value })}
                        placeholder="10"
                        className="bg-white text-gray-900 border-gray-200 text-center px-1"
                      />
                    </TableCell>
                    <TableCell>
                      <DatePicker
                        date={row.assessed_date}
                        setDate={(date) => updateRow(row.id, { assessed_date: date || new Date() })}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={row.is_retake}
                        onCheckedChange={(checked) =>
                          updateRow(row.id, { is_retake: checked === true })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {row.marks_obtained !== '' && (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold text-gray-900">
                            {percentage.toFixed(1)}%
                          </span>
                          <LowPointBadge percentage={percentage} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row.id)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
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

    </Card>
  )
}
