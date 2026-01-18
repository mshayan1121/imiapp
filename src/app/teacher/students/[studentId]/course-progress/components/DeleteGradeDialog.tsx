'use client'

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
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface DeleteGradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grade: any
  onConfirm: () => Promise<void>
}

export function DeleteGradeDialog({
  open,
  onOpenChange,
  grade,
  onConfirm,
}: DeleteGradeDialogProps) {
  if (!grade) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Grade?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this grade? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="p-4 bg-muted/30 rounded-lg border space-y-2 my-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold capitalize">
                {grade.work_type} - {grade.work_subtype}
              </p>
              <p className="text-xs text-muted-foreground">
                {grade.topics?.name} {grade.subtopics ? `> ${grade.subtopics.name}` : ''}
              </p>
            </div>
            <Badge variant={grade.is_low_point ? 'destructive' : 'default'}>
              {grade.percentage}%
            </Badge>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Marks: {grade.marks_obtained}/{grade.total_marks}</span>
            <span>Date: {format(new Date(grade.assessed_date), 'dd MMM yyyy')}</span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
