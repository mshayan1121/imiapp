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

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  count: number
}

export function ConfirmationDialog({ open, onOpenChange, onConfirm, count }: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Student Import</AlertDialogTitle>
          <AlertDialogDescription asChild className="space-y-4">
            <div className="text-muted-foreground text-sm">
              <p>You are about to import <strong>{count}</strong> new students.</p>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">What happens next:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Student records will be created</li>
                  <li>Contact information will be added</li>
                  <li>Students will appear in the directory immediately</li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            Confirm Import
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
