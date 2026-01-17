import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Users, AlertCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ClassPerformance {
  id: string
  name: string
  studentCount: number
  avgPercentage: number
  lowPointCount: number
}

interface ClassPerformanceOverviewProps {
  classes: ClassPerformance[]
}

export function ClassPerformanceOverview({ classes }: ClassPerformanceOverviewProps) {
  if (classes.length === 0) {
    return (
      <Card className="mb-8">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No classes assigned</h3>
          <p className="text-gray-500 max-w-sm">
            You haven't been assigned to any classes yet. Please contact the administrator if this
            is an error.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Class Performance This Term</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card key={cls.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-bold">{cls.name}</CardTitle>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {cls.studentCount} Students
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-gray-600">
                    Average Class Percentage
                  </span>
                  <span
                    className={cn(
                      'text-lg font-bold',
                      cls.avgPercentage < 70
                        ? 'text-red-600'
                        : cls.avgPercentage < 80
                          ? 'text-amber-600'
                          : 'text-green-600',
                    )}
                  >
                    {cls.avgPercentage}%
                  </span>
                </div>
                <Progress
                  value={cls.avgPercentage}
                  className={cn(
                    'h-2',
                    cls.avgPercentage < 70
                      ? '[&>div]:bg-red-500'
                      : cls.avgPercentage < 80
                        ? '[&>div]:bg-amber-500'
                        : '[&>div]:bg-green-500',
                  )}
                />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <AlertCircle
                  className={cn(
                    'h-4 w-4',
                    cls.lowPointCount > 0 ? 'text-amber-500' : 'text-gray-300',
                  )}
                />
                <span className="text-gray-600">
                  <span className="font-bold">{cls.lowPointCount}</span> Students with Low Points
                </span>
              </div>

              <Link href={`/teacher/progress?classId=${cls.id}`} className="mt-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto font-semibold"
                >
                  View Details <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
