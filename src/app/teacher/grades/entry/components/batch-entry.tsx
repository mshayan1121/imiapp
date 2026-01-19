'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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

const batchSchema = z.object({
  class_id: z.string().min(1, 'Class is required'),
  course_id: z.string().min(1, 'Course is required'),
  work_type: z.enum(['classwork', 'homework']),
  work_subtype: z.enum(['worksheet', 'pastpaper']),
  assessed_date: z.date(),
  topic_id: z.string().min(1, 'Topic is required'),
  subtopic_id: z.string().min(1, 'Subtopic is required'),
  total_marks: z.number().min(1, 'Total marks must be at least 1'),
})

type BatchFormValues = z.infer<typeof batchSchema>

import { Skeleton } from '@/components/ui/skeleton'

export function BatchEntry() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [subtopics, setSubtopics] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [activeTerm, setActiveTerm] = useState<any>(null)
  const [studentMarks, setStudentMarks] = useState<Record<string, number>>({})
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [retakeDialogOpen, setRetakeDialogOpen] = useState(false)
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([])
  const [retakeData, setRetakeData] = useState<{
    studentId: string
    existingGrades: any[]
    newGrade: any
  } | null>(null)

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      work_type: 'classwork',
      work_subtype: 'worksheet',
      assessed_date: new Date(),
      total_marks: 10,
    },
  })

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
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  const onClassChange = async (classId: string) => {
    form.setValue('class_id', classId)
    form.setValue('course_id', '')
    form.setValue('topic_id', '')
    form.setValue('subtopic_id', '')

    try {
      const { students } = await getClassDetails(classId)
      setStudents(students || [])

      // Extract unique courses from students
      const uniqueCourses = Array.from(new Set(students?.map((s) => s.course_id)))
        .map((id) => {
          const student = students?.find((s) => s.course_id === id)
          const course = student?.courses
          return Array.isArray(course) ? course[0] : course
        })
        .filter(Boolean)

      setCourses(uniqueCourses)

      if (uniqueCourses.length === 1 && uniqueCourses[0]) {
        onCourseChange(uniqueCourses[0].id)
      }
    } catch (error) {
      toast.error('Failed to load class details')
    }
  }

  const onCourseChange = async (courseId: string) => {
    form.setValue('course_id', courseId)
    form.setValue('topic_id', '')
    form.setValue('subtopic_id', '')

    try {
      const { topics } = await getCourseContent(courseId)
      setTopics(topics || [])
    } catch (error) {
      toast.error('Failed to load topics')
    }
  }

  const onTopicChange = async (topicId: string) => {
    form.setValue('topic_id', topicId)
    form.setValue('subtopic_id', '')

    try {
      const { subtopics } = await getSubtopics(topicId)
      setSubtopics(subtopics || [])
    } catch (error) {
      toast.error('Failed to load subtopics')
    }
  }

  const handleNext = async () => {
    const isValid = await form.trigger()
    if (isValid) {
      setStep(2)
    }
  }

  const handleMarkChange = (studentId: string, marks: string) => {
    const numMarks = parseFloat(marks)
    if (isNaN(numMarks)) {
      const newMarks = { ...studentMarks }
      delete newMarks[studentId]
      setStudentMarks(newMarks)
      return
    }

    if (numMarks > form.getValues('total_marks')) {
      toast.error('Marks obtained cannot exceed total marks')
      return
    }

    setStudentMarks({
      ...studentMarks,
      [studentId]: numMarks,
    })
  }

  const handleSubmitAll = async () => {
    if (!activeTerm) {
      toast.error('No active academic term found. Please contact admin.')
      return
    }
    const values = form.getValues()
    const entries = students
      .filter((s) => studentMarks[s.student_id] !== undefined)
      .map((s) => {
        const marks = studentMarks[s.student_id]
        const percentage = (marks / values.total_marks) * 100
        return {
          student_id: s.student_id,
          class_id: values.class_id,
          course_id: values.course_id,
          term_id: activeTerm.id,
          topic_id: values.topic_id,
          subtopic_id: values.subtopic_id,
          work_type: values.work_type,
          work_subtype: values.work_subtype,
          marks_obtained: marks,
          total_marks: values.total_marks,
          percentage: Math.round(percentage * 100) / 100,
          is_low_point: percentage < 80,
          assessed_date: format(values.assessed_date, 'yyyy-MM-dd'),
          attempt_number: 1,
        }
      })

    if (entries.length === 0) {
      toast.error('Please enter marks for at least one student')
      return
    }

    setPendingSubmissions(entries)
    setConfirmDialogOpen(true)
  }

  const processSubmission = async (entries: any[]) => {
    setLoading(true)
    try {
      // Check for existing grades for each entry
      const finalEntries = []

      for (const entry of entries) {
        const existing = await checkExistingGrades({
          student_id: entry.student_id,
          class_id: entry.class_id,
          course_id: entry.course_id,
          term_id: entry.term_id,
          topic_id: entry.topic_id,
          subtopic_id: entry.subtopic_id,
        })

        if (existing && existing.length > 0) {
          // Found existing grades, handle one by one
          setRetakeData({
            studentId: entry.student_id,
            existingGrades: existing,
            newGrade: entry,
          })
          setRetakeDialogOpen(true)
          setLoading(false)
          return // Stop and wait for user decision
        } else {
          finalEntries.push(entry)
        }
      }

      if (finalEntries.length > 0) {
        await submitGrades(finalEntries)
        const lpCount = finalEntries.filter((e) => e.is_low_point).length
        toast.success(
          `${finalEntries.length} grades entered, ${lpCount} students received Low Points`,
        )
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
        // Delete all old attempts
        for (const g of existingGrades) {
          await deleteGrade(g.id)
        }
        await submitGrades([{ ...newGrade, attempt_number: 1 }])
      } else {
        // Add as retake with incremented attempt number
        const maxAttempt = Math.max(...existingGrades.map((g) => g.attempt_number))
        await submitGrades([{ ...newGrade, attempt_number: maxAttempt + 1 }])
      }

      // Continue with remaining pending submissions
      const remaining = pendingSubmissions.filter((e) => e.student_id !== retakeData.studentId)
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

  const lowPointsCount = Object.entries(studentMarks).filter(([id, marks]) => {
    const percentage = (marks / form.getValues('total_marks')) * 100
    return percentage < 80
  }).length

  return (
    <Card className="border-none shadow-none bg-transparent">
      {step === 1 ? (
        <Form {...form}>
          <CardHeader className="px-0">
            <CardTitle>Step 1: Assessment Details</CardTitle>
          </CardHeader>
          <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={onClassChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    onValueChange={onCourseChange}
                    value={field.value}
                    disabled={!form.getValues('class_id')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="work_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Work Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="classwork" />
                        </FormControl>
                        <FormLabel className="font-normal">Classwork</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="homework" />
                        </FormControl>
                        <FormLabel className="font-normal">Homework</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="work_subtype"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Subtype</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="worksheet" />
                        </FormControl>
                        <FormLabel className="font-normal">Worksheet</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="pastpaper" />
                        </FormControl>
                        <FormLabel className="font-normal">Past Paper</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assessed_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Assessment Date</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="total_marks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Marks</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topic_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <Select
                    onValueChange={onTopicChange}
                    value={field.value}
                    disabled={!form.getValues('course_id')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {topics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtopic_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtopic</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!form.getValues('topic_id')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subtopic" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subtopics.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="px-0 flex justify-end">
            <Button onClick={handleNext}>Next Step</Button>
          </CardFooter>
        </Form>
      ) : (
        <>
          <CardHeader className="px-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Step 2: Enter Student Marks</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Class: {classes.find((c) => c.id === form.getValues('class_id'))?.name} | Subtopic:{' '}
                {subtopics.find((s) => s.id === form.getValues('subtopic_id'))?.name}
              </p>
            </div>
            <Button variant="outline" onClick={() => setStep(1)}>
              Back to Step 1
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Student Name</TableHead>
                    <TableHead className="w-[100px]">Year Group</TableHead>
                    <TableHead className="w-[120px]">Marks Obtained</TableHead>
                    <TableHead className="w-[100px]">Percentage</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const marks = studentMarks[student.student_id]
                    const total = form.getValues('total_marks')
                    const percentage = marks !== undefined ? (marks / total) * 100 : 0

                    return (
                      <TableRow key={student.student_id}>
                        <TableCell className="font-medium">{student.students.name}</TableCell>
                        <TableCell>{student.students.year_group}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0"
                            value={marks ?? ''}
                            onChange={(e) => handleMarkChange(student.student_id, e.target.value)}
                            className={
                              marks !== undefined && percentage < 80 ? 'border-destructive' : ''
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {marks !== undefined ? `${percentage.toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {marks !== undefined && <LowPointBadge percentage={percentage} />}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="px-0 flex flex-col items-stretch gap-4">
            <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
              <span className="text-sm font-medium">
                Summary: {Object.keys(studentMarks).length} grades entered.
                {lowPointsCount > 0 && (
                  <span className="text-destructive ml-2">
                    {lowPointsCount} students will receive Low Points.
                  </span>
                )}
              </span>
              <Button onClick={handleSubmitAll} loading={loading}>
                Submit All Grades
              </Button>
            </div>
          </CardFooter>
        </>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Grade Submission</AlertDialogTitle>
            <AlertDialogDescription>
              You are entering grades for{' '}
              {subtopics.find((s) => s.id === form.getValues('subtopic_id'))?.name} for{' '}
              {pendingSubmissions.length} students in{' '}
              {classes.find((c) => c.id === form.getValues('class_id'))?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
                // Skip this student and continue with others if any
                const remaining = pendingSubmissions.filter(
                  (e) => e.student_id !== retakeData?.studentId,
                )
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
