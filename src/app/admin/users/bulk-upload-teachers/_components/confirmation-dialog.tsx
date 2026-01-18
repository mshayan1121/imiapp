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
import { AlertTriangle, Check } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
          <AlertDialogTitle>Confirm Teacher Import</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>You are about to import <strong>{count}</strong> new teachers.</p>
            
            <div className="space-y-2 text-sm">
              <p className="font-medium">What happens next:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Teacher accounts will be created</li>
                <li>Temporary passwords will be generated</li>
                <li>Teachers will be granted access immediately</li>
              </ul>
            </div>

            <Alert className="bg-amber-50 border-amber-200 text-amber-900 mt-4">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs ml-2">
                <strong>Important:</strong> Passwords will be shown in the results. You must share them with teachers manually via WhatsApp, email, or in-person.
              </AlertDescription>
            </Alert>
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
