'use client'

import { useState, useEffect, use } from 'react'
import { getStudentDetailProgress } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts'
import {
  ChevronLeft,
  GraduationCap,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { StatCard } from '@/components/layout/stat-card'

export default function StudentProgressDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ term?: string }>
}) {
  const { studentId } = use(params)
  const { term } = use(searchParams)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (studentId && term) {
      loadData()
    }
  }, [studentId, term])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const res = await getStudentDetailProgress(studentId, term!)
      setData(res)
    } catch (error: any) {
      console.error(error)
      const errorMessage = error?.message || 'Failed to load progress data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading progress data...</p>
          </div>
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h2 className="text-lg font-bold">Failed to Load Progress</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
              </div>
              <Button onClick={() => loadData()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  if (!data) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">No data available</p>
            <Button onClick={() => loadData()}>Reload</Button>
          </div>
        </div>
      </PageContainer>
    )
  }

  const chartData = data.gradeTimeline.map((g: any) => ({
    date: format(new Date(g.assessed_date), 'dd MMM'),
    percentage: g.percentage,
    topic: g.topics.name,
    isLP: g.is_low_point,
  }))

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const flags =
    data.overallStats.totalLP >= 5
      ? 3
      : data.overallStats.totalLP >= 4
        ? 2
        : data.overallStats.totalLP >= 3
          ? 1
          : 0

  const action = (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/teacher/students/${studentId}/course-progress?classId=${data.studentInfo.class_students?.[0]?.classes?.id}&courseId=${data.studentInfo.class_students?.[0]?.courses?.id}&termId=${term}`}>
          <FileText className="mr-2 h-4 w-4" /> Curriculum Progress
        </Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href="/teacher/progress">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Class
        </Link>
      </Button>
    </div>
  )

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title={data.studentInfo.name}
        subtitle={`${data.studentInfo.year_group} • ${data.studentInfo.school || 'ABC Academy'}`}
        action={action}
      >
        <div className="flex gap-2 mt-2">
          {data.studentInfo.class_students?.[0]?.courses?.name && (
            <Badge variant="secondary">{data.studentInfo.class_students[0].courses.name}</Badge>
          )}
        </div>
      </PageHeader>

      <Section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard title="Total Grades" value={data.overallStats.totalGrades} icon={FileText} />
          <StatCard
            title="Low Points"
            value={data.overallStats.totalLP}
            icon={AlertCircle}
            className="border-red-100"
          />
          <StatCard
            title="Average %"
            value={`${data.overallStats.averagePercentage}%`}
            icon={TrendingUp}
          />
          <StatCard title="Rank" value="-" icon={GraduationCap} />
        </div>
      </Section>

      <Section>
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Grade Trends</CardTitle>
                <CardDescription>Performance over time for this term</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="text-xs text-muted-foreground">
                                  {payload[0].payload.date}
                                </p>
                                <p className="font-bold">{payload[0].payload.topic}</p>
                                <p className="text-sm font-medium text-primary">
                                  {payload[0].value}%
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <ReferenceLine
                        y={80}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        label={{ position: 'right', value: '80%', fill: '#ef4444', fontSize: 10 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="percentage"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={(props) => {
                          const { cx, cy, payload } = props
                          return (
                            <Dot
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill={payload.isLP ? '#ef4444' : '#22c55e'}
                              stroke="white"
                              strokeWidth={2}
                            />
                          )
                        }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.topicPerformance.map((tp: any) => (
                <Card key={tp.name}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                          {tp.topic}
                        </p>
                        <h4 className="font-bold leading-tight">{tp.subtopic}</h4>
                      </div>
                      <Badge
                        variant={tp.lpCount > 0 ? 'destructive' : 'default'}
                        className={
                          tp.lpCount === 0 ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''
                        }
                      >
                        {tp.avg}% AVG
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-dashed">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Count</p>
                        <p className="text-sm font-bold">{tp.count}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Best</p>
                        <p className="text-sm font-bold text-green-600">{tp.best}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Latest</p>
                        <p
                          className={`text-sm font-bold ${tp.latest < 80 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {tp.latest}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>Trend: stable</span>
                      </div>
                      {tp.lpCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          <span>{tp.lpCount} LP</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Marks</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.gradeTimeline.map((grade: any) => (
                      <TableRow key={grade.id}>
                        <TableCell className="text-xs">
                          {format(new Date(grade.assessed_date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{grade.topics?.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {grade.subtopics?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {grade.work_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {grade.marks_obtained}/{grade.total_marks}
                        </TableCell>
                        <TableCell className="text-right font-bold">{grade.percentage}%</TableCell>
                        <TableCell>
                          {grade.is_low_point ? (
                            <Badge variant="destructive" className="bg-red-100 text-red-700">
                              LP
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-100 text-green-700">
                              PASS
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-red-100 bg-red-50/30">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" /> Flagged Areas
                  </CardTitle>
                  <CardDescription>Topics where student is currently struggling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.topicPerformance
                    .filter((tp: any) => tp.lpCount > 0)
                    .map((tp: any) => (
                      <div
                        key={tp.name}
                        className="flex items-center justify-between p-3 bg-background rounded-md border border-red-100"
                      >
                        <div>
                          <p className="font-medium text-sm">{tp.subtopic}</p>
                          <p className="text-xs text-muted-foreground">{tp.topic}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-600 font-bold text-sm">{tp.lpCount} LP</p>
                          <p className="text-[10px] text-muted-foreground">Avg: {tp.avg}%</p>
                        </div>
                      </div>
                    ))}
                  {data.topicPerformance.filter((tp: any) => tp.lpCount > 0).length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      No flagged areas for this student.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" /> Improvement Plan
                  </CardTitle>
                  <CardDescription>Suggested actions based on current data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {flags >= 3 && (
                    <ActionItem
                      title="Urgent Meeting Required"
                      description="Schedule a parent-teacher meeting to discuss intervention strategies."
                      type="critical"
                    />
                  )}
                  {flags >= 1 && (
                    <ActionItem
                      title="Focus on Topic Revision"
                      description="Student has multiple low points in specific topics. Recommend targeted worksheet practice."
                      type="warning"
                    />
                  )}
                  <ActionItem
                    title="Retake Opportunity"
                    description="Identify assessments with < 80% for potential retakes to improve foundational knowledge."
                    type="info"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Section>
    </PageContainer>
  )
}

function ActionItem({
  title,
  description,
  type,
}: {
  title: string
  description: string
  type: 'critical' | 'warning' | 'info'
}) {
  const colors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  }
  return (
    <div className={`p-4 rounded-lg border ${colors[type]}`}>
      <h5 className="font-bold text-sm">{title}</h5>
      <p className="text-xs mt-1 opacity-90">{description}</p>
    </div>
  )
}
