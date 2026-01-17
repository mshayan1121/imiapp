import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, CheckCircle2, MessageSquare, Phone, Users } from 'lucide-react'
import Link from 'next/link'

interface CriticalAlertsProps {
  flaggedCount: number
  flagBreakdown: {
    one: number
    two: number
    three: number
  }
  noActiveTerm: boolean
}

export function CriticalAlerts({ flaggedCount, flagBreakdown, noActiveTerm }: CriticalAlertsProps) {
  if (noActiveTerm) {
    return (
      <Alert variant="destructive" className="mb-8 border-2">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">System Alert: No Active Term</AlertTitle>
        <AlertDescription className="mt-2 flex items-center justify-between">
          <span>
            Please set an active term in the System Settings to enable grade tracking and
            performance monitoring.
          </span>
          <Link href="/admin/terms">
            <Button variant="destructive" size="sm" className="font-bold">
              Set Active Term
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4 mb-8">
      {flaggedCount > 0 ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900">Institute-Wide Flagged Students</h2>
                <p className="text-red-700 font-medium">
                  {flaggedCount} students require immediate attention
                </p>
              </div>
            </div>
            <Link href="/admin/flags">
              <Button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6">
                View Flag Dashboard
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🟡</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{flagBreakdown.one} Students</p>
                  <p className="text-xs text-gray-500 font-medium">1 Flag - Message Parents</p>
                </div>
              </div>
              <MessageSquare className="h-4 w-4 text-amber-500" />
            </div>

            <div className="bg-white p-4 rounded-lg border border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🟠</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{flagBreakdown.two} Students</p>
                  <p className="text-xs text-gray-500 font-medium">2 Flags - Call Parents</p>
                </div>
              </div>
              <Phone className="h-4 w-4 text-orange-500" />
            </div>

            <div className="bg-white p-4 rounded-lg border border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔴</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{flagBreakdown.three} Students</p>
                  <p className="text-xs text-gray-500 font-medium">3 Flags - Meeting Required</p>
                </div>
              </div>
              <Users className="h-4 w-4 text-red-600" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
          <div className="bg-green-100 p-2 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-green-900">System Health: Excellent</h2>
            <p className="text-green-700">
              All students are performing within expected ranges. No critical flags detected.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
