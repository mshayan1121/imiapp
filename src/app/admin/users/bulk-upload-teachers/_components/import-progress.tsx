'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'

interface ImportProgressProps {
  current: number
  total: number
  currentName: string
}

export function ImportProgress({ current, total, currentName }: ImportProgressProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Importing Teachers...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium">{current} of {total}</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          <div className="bg-gray-50 p-3 rounded-md border text-sm text-center">
            <p className="text-gray-500 mb-1">Processing:</p>
            <p className="font-medium truncate">{currentName || 'Starting...'}</p>
          </div>
          
          <p className="text-xs text-center text-gray-400">
            Please do not close this window.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
