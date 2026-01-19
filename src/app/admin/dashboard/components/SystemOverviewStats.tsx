import { Users, UserCheck, BookOpen, Layers, Flag } from 'lucide-react'
import { StatCard } from '@/components/layout/stat-card'

interface SystemOverviewStatsProps {
  stats: {
    totalStudents: number
    totalTeachers: number
    totalClasses: number
    totalCourses: number
    totalGrades: number
    totalFlags: number
  }
}

export function SystemOverviewStats({ stats }: SystemOverviewStatsProps) {
  const cards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: UserCheck,
    },
    {
      title: 'Active Classes',
      value: stats.totalClasses,
      icon: Layers,
    },
    {
      title: 'Courses Offered',
      value: stats.totalCourses,
      icon: BookOpen,
    },
    {
      title: 'Flags This Term',
      value: stats.totalFlags,
      icon: Flag,
    },
  ]

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, i) => (
        <StatCard key={i} title={card.title} value={card.value} icon={card.icon} />
      ))}
    </div>
  )
}
