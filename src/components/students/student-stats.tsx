'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, AlertTriangle, Flag, BarChart3 } from 'lucide-react'
import { StudentWithStats } from '@/types/students'

interface StudentStatsProps {
  students: StudentWithStats[]
  totalCount: number
}

export function StudentStats({ students, totalCount }: StudentStatsProps) {
  const strugglingCount = students.filter(s => s.stats.status === 'Struggling').length
  const flaggedCount = students.filter(s => s.stats.flag_count > 0).length
  const averagePerformance = students.length > 0
    ? students.reduce((acc, s) => acc + s.stats.average_percentage, 0) / students.length
    : 0

  const stats = [
    {
      title: 'Total Students',
      value: totalCount,
      icon: Users,
      description: `Showing ${students.length} filtered`,
    },
    {
      title: 'Struggling',
      value: strugglingCount,
      icon: AlertTriangle,
      description: 'Performance < 70%',
      color: 'text-red-600',
    },
    {
      title: 'Flagged Students',
      value: flaggedCount,
      icon: Flag,
      description: 'With active flags',
      color: 'text-orange-600',
    },
    {
      title: 'Avg. Performance',
      value: `${averagePerformance.toFixed(1)}%`,
      icon: BarChart3,
      description: 'Across filtered students',
      color: averagePerformance >= 80 ? 'text-green-600' : averagePerformance >= 70 ? 'text-yellow-600' : 'text-red-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
