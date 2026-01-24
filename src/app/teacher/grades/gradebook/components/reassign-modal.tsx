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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { reassignHomework } from '../actions'
import { cn } from '@/lib/utils'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import type { GradeEntry } from '../types'

const reassignFormSchema = z.object({
  newDeadline: z.string().min(1, 'New deadline is required'),
  notes: z.string().optional(),
})

type ReassignFormValues = z.infer<typeof reassignFormSchema>

interface ReassignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topicName: string
  rowType: 'topic' | 'subtopic'
  originalGrade: GradeEntry
  studentName: string
  onSuccess: () => void
}

export function ReassignModal({
  open,
  onOpenChange,
  topicName,
  rowType,
  originalGrade,
  studentName,
  onSuccess,
}: ReassignModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Default to one week from today
  const defaultDeadline = new Date()
  defaultDeadline.setDate(defaultDeadline.getDate() + 7)

  const form = useForm<ReassignFormValues>({
    resolver: zodResolver(reassignFormSchema),
    defaultValues: {
      newDeadline: defaultDeadline.toISOString().split('T')[0],
      notes: '',
    },
  })

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleSubmit = async (values: ReassignFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await reassignHomework(
        originalGrade.id,
        values.newDeadline,
        values.notes
      )

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Homework reassigned successfully')
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
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-orange-600" />
            Reassign Homework
          </DialogTitle>
          <DialogDescription>
            {studentName} - {rowType === 'topic' ? 'Topic' : 'Subtopic'}: {topicName}
          </DialogDescription>
        </DialogHeader>

        {/* Warning */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-orange-800">Reassigning Homework</p>
            <p className="text-orange-700 mt-1">
              This will mark the original homework as "reassigned" and create a new empty
              homework entry for the student to complete by the new deadline.
            </p>
          </div>
        </div>

        {/* Original Grade Info */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase">
            Original Homework
          </p>
          <div className="flex items-center justify-between">
            <span className="font-mono">
              {originalGrade.marksObtained}/{originalGrade.totalMarks}
            </span>
            <span className={cn('font-bold', getPercentageColor(originalGrade.percentage))}>
              {originalGrade.percentage}%
            </span>
            <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
              Low Point
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Due: {originalGrade.assessedDate}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newDeadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Deadline</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes for Student (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Please focus on questions 3-5..."
                      className="resize-none h-20"
                      {...field}
                    />
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? 'Reassigning...' : 'Reassign Homework'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
