'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { addRetake } from '../actions'
import { cn } from '@/lib/utils'
import type { GradeEntry } from '../types'

const retakeFormSchema = z.object({
  marksObtained: z.number().min(0, 'Must be 0 or more'),
  totalMarks: z.number().min(1, 'Must be at least 1'),
  workType: z.enum(['classwork', 'homework']),
  workSubtype: z.enum(['worksheet', 'pastpaper']),
  assessedDate: z.string().min(1, 'Date is required'),
})

type RetakeFormValues = z.infer<typeof retakeFormSchema>

interface RetakeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topicName: string
  rowType: 'topic' | 'subtopic'
  topicId: string
  subtopicId: string | null
  originalGrade: GradeEntry
  studentId: string
  studentName: string
  classId: string
  courseId: string
  termId: string
  onSuccess: () => void
}

export function RetakeModal({
  open,
  onOpenChange,
  topicName,
  rowType,
  topicId,
  subtopicId,
  originalGrade,
  studentId,
  studentName,
  classId,
  courseId,
  termId,
  onSuccess,
}: RetakeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RetakeFormValues>({
    resolver: zodResolver(retakeFormSchema),
    defaultValues: {
      marksObtained: 0,
      totalMarks: originalGrade.totalMarks,
      workType: originalGrade.workType,
      workSubtype: originalGrade.workSubtype,
      assessedDate: new Date().toISOString().split('T')[0],
    },
  })

  const marks = form.watch('marksObtained')
  const total = form.watch('totalMarks')
  const previewPercentage = total > 0 ? Math.round((marks / total) * 100) : 0
  const isImproved = previewPercentage > originalGrade.percentage

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleSubmit = async (values: RetakeFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await addRetake({
        originalGradeId: originalGrade.id,
        studentId,
        classId,
        courseId,
        termId,
        topicId,
        subtopicId,
        marksObtained: values.marksObtained,
        totalMarks: values.totalMarks,
        workType: values.workType,
        workSubtype: values.workSubtype,
        assessedDate: values.assessedDate,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Retake added successfully')
        onSuccess()
        onOpenChange(false)
        form.reset()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add Retake</DialogTitle>
          <DialogDescription>
            {studentName} - {rowType === 'topic' ? 'Topic' : 'Subtopic'}: {topicName}
          </DialogDescription>
        </DialogHeader>

        {/* Original Grade Info */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase">Original Grade</p>
          <div className="flex items-center justify-between">
            <span className="font-mono">
              {originalGrade.marksObtained}/{originalGrade.totalMarks}
            </span>
            <span className={cn('font-bold', getPercentageColor(originalGrade.percentage))}>
              {originalGrade.percentage}%
            </span>
            <Badge variant="outline" className="text-xs">
              Attempt #{originalGrade.attemptNumber}
            </Badge>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="marksObtained"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks Obtained</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Marks</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preview */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-dashed">
              <span className="text-sm font-medium">New Percentage</span>
              <div className="flex items-center gap-2">
                <span
                  className={cn('text-xl font-bold', getPercentageColor(previewPercentage))}
                >
                  {previewPercentage}%
                </span>
                {isImproved && (
                  <Badge className="bg-green-100 text-green-700">
                    +{previewPercentage - originalGrade.percentage}%
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="workType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                name="workSubtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtype</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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

            <FormField
              control={form.control}
              name="assessedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Retake'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
