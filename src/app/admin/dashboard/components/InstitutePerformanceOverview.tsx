import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Award, AlertCircle, BookOpen, Target } from 'lucide-react'

interface InstitutePerformanceOverviewProps {
  performance: {
    instituteAvg: number
    lpPercentage: number
  }
}

export function InstitutePerformanceOverview({ performance }: InstitutePerformanceOverviewProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Performance Statistics (This Term)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Institute Avg</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">
                {performance.instituteAvg}%
              </span>
              <span className="text-xs font-bold text-green-600">↑ 2%</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">LP Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">
                {performance.lpPercentage}%
              </span>
              <span className="text-xs font-bold text-red-600">↓ 1%</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Overall Progress to Goal
              </span>
              <span className="text-xs font-black text-slate-900">
                {performance.instituteAvg}/100
              </span>
            </div>
            <Progress
              value={performance.instituteAvg}
              className="h-3 [&>div]:bg-blue-600 bg-blue-50"
            />
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-green-600" />
                <span className="text-sm font-bold text-green-900">Top Subject</span>
              </div>
              <span className="text-sm font-black text-green-700">Mathematics</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-red-600" />
                <span className="text-sm font-bold text-red-900">Critical Subject</span>
              </div>
              <span className="text-sm font-black text-red-700">Physics</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
