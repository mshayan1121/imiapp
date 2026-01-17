import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2, MessageSquare, Phone, Users } from 'lucide-react'
import Link from 'next/link'

interface FlaggedStudentsAlertProps {
  flaggedCount: number
  breakdown: {
    one: number
    two: number
    three: number
  }
  criticalStudents: { id: string; name: string }[]
}

export function FlaggedStudentsAlert({
  flaggedCount,
  breakdown,
  criticalStudents,
}: FlaggedStudentsAlertProps) {
  if (flaggedCount === 0) {
    return (
      <Card className="mb-8 border-green-100 bg-green-50/50">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">All students on track! 🎉</h3>
            <p className="text-green-700">
              Great work! All students are performing well this term.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8 border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg font-bold text-amber-900">
              Students Requiring Attention
            </CardTitle>
          </div>
          <Link href="/teacher/progress">
            <Button variant="outline" size="sm" className="bg-white">
              View All Flagged Students
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-100">
            <div className="text-2xl">🟡</div>
            <div>
              <p className="text-sm font-medium text-gray-600">1 Flag ({breakdown.one} students)</p>
              <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                <MessageSquare className="h-3 w-3" /> Message Parents
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-100">
            <div className="text-2xl">🟠</div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                2 Flags ({breakdown.two} students)
              </p>
              <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                <Phone className="h-3 w-3" /> Call Parents
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-100">
            <div className="text-2xl">🔴</div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                3 Flags ({breakdown.three} students)
              </p>
              <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <Users className="h-3 w-3" /> Meeting Required
              </div>
            </div>
          </div>
        </div>

        {criticalStudents.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Most Critical Students:</p>
            <div className="flex flex-wrap gap-2">
              {criticalStudents.map((student) => (
                <Link key={student.id} href={`/teacher/progress/${student.id}`}>
                  <Badge
                    variant="outline"
                    className="bg-white hover:bg-red-50 hover:text-red-700 cursor-pointer border-red-100"
                  >
                    {student.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
