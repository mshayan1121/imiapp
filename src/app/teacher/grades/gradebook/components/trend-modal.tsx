'use client'

import { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Award, Calendar, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GradeEntry, TrendStats } from '../types'

interface TrendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topicName: string
  rowType: 'topic' | 'subtopic'
  grades: GradeEntry[]
  studentName: string
}

export function TrendModal({
  open,
  onOpenChange,
  topicName,
  rowType,
  grades,
  studentName,
}: TrendModalProps) {
  // Sort grades by date for chart
  const sortedGrades = useMemo(
    () => [...grades].sort((a, b) => new Date(a.assessedDate).getTime() - new Date(b.assessedDate).getTime()),
    [grades]
  )

  // Calculate stats
  const stats = useMemo<TrendStats>(() => {
    if (grades.length === 0) {
      return {
        bestAttempt: 0,
        latestAttempt: 0,
        average: 0,
        totalAttempts: 0,
        retakeCount: 0,
      }
    }

    const percentages = grades.map((g) => g.percentage)
    const bestAttempt = Math.max(...percentages)
    const latestAttempt = grades[0]?.percentage || 0 // grades[0] is the latest since we sort desc
    const average = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
    const retakeCount = grades.filter((g) => g.isRetake).length

    return {
      bestAttempt,
      latestAttempt,
      average,
      totalAttempts: grades.length,
      retakeCount,
    }
  }, [grades])

  // Chart data
  const chartData = useMemo(
    () =>
      sortedGrades.map((grade) => ({
        date: format(new Date(grade.assessedDate), 'MMM d'),
        fullDate: format(new Date(grade.assessedDate), 'MMM d, yyyy'),
        percentage: grade.percentage,
        isRetake: grade.isRetake,
        isReassigned: grade.isReassigned,
        attempt: grade.attemptNumber,
        marks: `${grade.marksObtained}/${grade.totalMarks}`,
        workType: grade.workType,
      })),
    [sortedGrades]
  )

  // Trend direction
  const trendDirection = useMemo(() => {
    if (sortedGrades.length < 2) return 'neutral'
    const first = sortedGrades[0]?.percentage || 0
    const last = sortedGrades[sortedGrades.length - 1]?.percentage || 0
    return last > first ? 'up' : last < first ? 'down' : 'neutral'
  }, [sortedGrades])

  const getStatusBadge = (grade: GradeEntry) => {
    if (grade.isRetake) {
      return <Badge variant="secondary" className="text-xs bg-blue-100">Retake</Badge>
    }
    if (grade.isReassigned) {
      return <Badge variant="secondary" className="text-xs bg-orange-100">Reassigned</Badge>
    }
    return <Badge variant="outline" className="text-xs">Original</Badge>
  }

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium">{data.fullDate}</p>
          <p className={cn('text-lg font-bold', getPercentageColor(data.percentage))}>
            {data.percentage}%
          </p>
          <p className="text-muted-foreground text-xs">{data.marks}</p>
          <p className="text-xs mt-1 capitalize">{data.workType}</p>
          {data.isRetake && <p className="text-xs text-blue-600">Retake attempt</p>}
          {data.isReassigned && <p className="text-xs text-orange-600">Reassigned</p>}
        </div>
      )
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Grade Trend
            {trendDirection === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
            {trendDirection === 'down' && <TrendingDown className="h-5 w-5 text-red-600" />}
          </DialogTitle>
          <DialogDescription>
            {studentName} - {rowType === 'topic' ? 'Topic' : 'Subtopic'}: {topicName}
          </DialogDescription>
        </DialogHeader>

        {grades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No grades recorded yet for this {rowType}.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <Award className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-2xl font-bold text-green-700">{stats.bestAttempt}%</p>
                <p className="text-xs text-green-600">Best</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <Calendar className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                <p className={cn('text-2xl font-bold', getPercentageColor(stats.latestAttempt))}>
                  {stats.latestAttempt}%
                </p>
                <p className="text-xs text-blue-600">Latest</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className={cn('text-2xl font-bold', getPercentageColor(stats.average))}>
                  {stats.average}%
                </p>
                <p className="text-xs text-gray-600">Average</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <RotateCcw className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                <p className="text-2xl font-bold text-purple-700">{stats.retakeCount}</p>
                <p className="text-xs text-purple-600">Retakes</p>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 1 && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={80}
                      stroke="#22c55e"
                      strokeDasharray="5 5"
                      label={{ value: '80%', position: 'right', fontSize: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{
                        fill: '#3b82f6',
                        strokeWidth: 2,
                        r: 4,
                      }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <Separator />

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">All Attempts</h4>
              <div className="space-y-2">
                {sortedGrades.reverse().map((grade, index) => (
                  <div
                    key={grade.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      index === 0 && 'border-blue-200 bg-blue-50/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[60px]">
                        <p
                          className={cn(
                            'text-xl font-bold',
                            getPercentageColor(grade.percentage)
                          )}
                        >
                          {grade.percentage}%
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {grade.marksObtained}/{grade.totalMarks}
                        </p>
                      </div>
                      <Separator orientation="vertical" className="h-10" />
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(grade.assessedDate), 'MMM d, yyyy')}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">
                            {grade.workType} - {grade.workSubtype}
                          </span>
                          {getStatusBadge(grade)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={index === 0 ? 'default' : 'outline'} className="text-xs">
                        Attempt #{grade.attemptNumber}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
