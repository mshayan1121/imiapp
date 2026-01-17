import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, UserPlus, AlertTriangle, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: string
  message: string
  timestamp: string
}

interface RecentActivityFeedProps {
  activities: Activity[]
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Recent System Activity</CardTitle>
        <Badge variant="outline" className="flex items-center gap-1.5 font-medium text-xs py-0.5">
          <RefreshCw className="h-3 w-3 animate-spin-slow" />
          Auto-refreshing
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto max-h-[500px] pr-2">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p>No recent activity detected.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4 items-start relative pb-6 last:pb-0">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-[30px] bottom-0 w-[2px] bg-slate-100 last:hidden" />

                <div
                  className={`p-2 rounded-full shrink-0 z-10 ${
                    activity.type === 'grade'
                      ? 'bg-blue-100 text-blue-600'
                      : activity.type === 'enrollment'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {activity.type === 'grade' && <FileText className="h-4 w-4" />}
                  {activity.type === 'enrollment' && <UserPlus className="h-4 w-4" />}
                  {activity.type === 'flag' && <AlertTriangle className="h-4 w-4" />}
                </div>

                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-tight text-gray-900">
                    {activity.message}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
