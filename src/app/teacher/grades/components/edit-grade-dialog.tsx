'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea'
import { updateGrade } from '../actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

const formSchema = z.object({
  work_type: z.enum(['classwork', 'homework']),
  work_subtype: z.enum(['worksheet', 'pastpaper']),
  marks_obtained: z.number().min(0),
  total_marks: z.number().min(1),
  assessed_date: z.string(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditGradeDialogProps {
  grade: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditGradeDialog({ grade, open, onOpenChange, onSuccess }: EditGradeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      work_type: 'classwork',
      work_subtype: 'worksheet',
      marks_obtained: 0,
      total_marks: 0,
      assessed_date: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (grade) {
      form.reset({
        work_type: grade.work_type,
        work_subtype: grade.work_subtype,
        marks_obtained: grade.marks_obtained,
        total_marks: grade.total_marks,
        assessed_date: grade.assessed_date,
        notes: grade.notes || '',
      })
    }
  }, [grade, form])

  const onSubmit = async (values: FormValues) => {
    const percentage = Math.round((values.marks_obtained / values.total_marks) * 100)
    const is_low_point = percentage < 80

    setIsSubmitting(true)
    try {
      const result = await updateGrade(grade.id, {
        ...values,
        percentage,
        is_low_point,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Grade updated successfully')
        onSuccess()
        onOpenChange(false)
      }
    } catch (error) {
      toast.error('Failed to update grade')
    } finally {
      setIsSubmitting(false)
    }
  }

  const marks = form.watch('marks_obtained')
  const total = form.watch('total_marks')
  const percentage = total > 0 ? Math.round((marks / total) * 100) : 0
  const isLP = percentage < 80

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Grade</DialogTitle>
        </DialogHeader>

        {grade && (
          <div className="mb-4 p-4 bg-muted/30 rounded-lg border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Student</p>
              <p className="font-medium">{grade.students?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Current Score</p>
              <div className="flex items-center gap-2">
                <span className="font-mono">
                  {grade.marks_obtained}/{grade.total_marks}
                </span>
                <span
                  className={`font-bold ${grade.is_low_point ? 'text-red-600' : 'text-green-600'}`}
                >
                  {grade.percentage}%
                </span>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Subtype</FormLabel>
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
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border border-dashed">
              <div className="text-sm font-medium">New Percentage</div>
              <div className="flex items-center gap-3">
                <span className={`text-xl font-bold ${isLP ? 'text-red-600' : 'text-green-600'}`}>
                  {percentage}%
                </span>
                {isLP ? (
                  <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                    LOW POINT
                  </Badge>
                ) : (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-700 hover:bg-green-100"
                  >
                    PASS
                  </Badge>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="assessed_date"
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any context or feedback..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
