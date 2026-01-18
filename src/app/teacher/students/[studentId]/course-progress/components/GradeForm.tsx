'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle } from 'lucide-react'

const formSchema = z.object({
  work_type: z.enum(['classwork', 'homework']),
  work_subtype: z.enum(['worksheet', 'pastpaper']),
  marks_obtained: z.coerce.number().min(0),
  total_marks: z.coerce.number().min(1),
  assessed_date: z.date(),
  notes: z.string().optional(),
})

interface GradeFormProps {
  initialData?: any
  topicName: string
  subtopicName?: string
  topicId: string
  subtopicId: string | null
  studentName: string
  className: string
  courseName: string
  existingGrades: any[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export function GradeForm({
  initialData,
  topicName,
  subtopicName,
  topicId,
  subtopicId,
  studentName,
  className,
  courseName,
  existingGrades,
  onSubmit,
  onCancel,
}: GradeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRetakeWarning, setShowRetakeWarning] = useState(false)
  const [pendingValues, setPendingValues] = useState<any>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      work_type: initialData?.work_type || 'classwork',
      work_subtype: initialData?.work_subtype || 'worksheet',
      marks_obtained: initialData?.marks_obtained || 0,
      total_marks: initialData?.total_marks || 20,
      assessed_date: initialData?.assessed_date ? new Date(initialData.assessed_date) : new Date(),
      notes: initialData?.notes || '',
    },
  })

  const marksObtained = form.watch('marks_obtained')
  const totalMarks = form.watch('total_marks')
  const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100 * 10) / 10 : 0
  const isLP = percentage < 80

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check if grade already exists for this topic/subtopic (if adding new)
    if (!initialData && existingGrades.length > 0) {
      setPendingValues(values)
      setShowRetakeWarning(true)
      return
    }

    await performSubmit(values)
  }

  const performSubmit = async (values: any, options?: { replace?: boolean }) => {
    setIsSubmitting(true)
    try {
      let attemptNumber = 1
      if (!initialData && !options?.replace) {
        attemptNumber = Math.max(0, ...existingGrades.map(g => g.attempt_number || 1)) + 1
      }

      await onSubmit({
        ...values,
        id: options?.replace ? existingGrades[0].id : initialData?.id,
        topic_id: topicId,
        subtopic_id: subtopicId,
        percentage,
        is_low_point: isLP,
        assessed_date: values.assessed_date.toISOString().split('T')[0],
        attempt_number: attemptNumber,
      })
    } finally {
      setIsSubmitting(false)
      setShowRetakeWarning(false)
    }
  }

  if (showRetakeWarning) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex items-start gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-yellow-900">Existing Grade Found</h4>
            <p className="text-sm text-yellow-800">
              Student already has a grade for this {subtopicName ? 'subtopic' : 'topic'}. 
              Would you like to replace the existing grade or add this as a retake?
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Existing Grade Details</p>
          {existingGrades.map((g, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded border text-sm">
              <div>
                <span className="font-semibold capitalize">{g.work_type} - {g.work_subtype}</span>
                <span className="text-muted-foreground ml-2">({g.percentage}%)</span>
              </div>
              <span className="text-muted-foreground text-xs">{g.assessed_date}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <Button onClick={() => performSubmit(pendingValues, { replace: true })} variant="default">
            Replace Old Grade
          </Button>
          <Button onClick={() => performSubmit(pendingValues)} variant="outline">
            Add as Retake (Attempt {Math.max(0, ...existingGrades.map(g => g.attempt_number || 1)) + 1})
          </Button>
          <Button onClick={() => setShowRetakeWarning(false)} variant="ghost">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Student</p>
            <p className="font-medium">{studentName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Class</p>
            <p className="font-medium">{className}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Course</p>
            <p className="font-medium">{courseName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Topic / Subtopic</p>
            <p className="font-medium">{topicName} {subtopicName ? `> ${subtopicName}` : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="work_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="classwork">Classwork</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="work_subtype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Subtype</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subtype" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="worksheet">Worksheet</SelectItem>
                    <SelectItem value="pastpaper">Past Paper</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="marks_obtained"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marks Obtained</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" {...field} />
                </FormControl>
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
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-dashed">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Auto-Calculated Percentage</span>
            <span className="text-2xl font-bold">{percentage}%</span>
          </div>
          <div className="flex items-center gap-2">
            {isLP ? (
              <Badge className="bg-red-100 text-red-800 border-red-200 h-8 px-3">
                <AlertTriangle className="mr-2 h-4 w-4" /> Low Point
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800 border-green-200 h-8 px-3">
                <CheckCircle className="mr-2 h-4 w-4" /> Pass
              </Badge>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="assessed_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Assessment Date</FormLabel>
              <DatePicker 
                date={field.value} 
                setDate={(date) => field.onChange(date || new Date())} 
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional comments here..." 
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || marksObtained > totalMarks}>
            {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Grade'}
          </Button>
        </div>
        {marksObtained > totalMarks && (
          <p className="text-xs text-red-600 text-right mt-1">Marks obtained cannot exceed total marks</p>
        )}
      </form>
    </Form>
  )
}
