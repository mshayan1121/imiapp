import { Users, UserCheck, BookOpen, Layers, FileText } from 'lucide-react'
import { StatCard } from '@/components/layout/stat-card'

interface SystemOverviewStatsProps {
  stats: {
    totalStudents: number
    totalTeachers: number
    totalClasses: number
    totalCourses: number
    totalGrades: number
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
      title: 'Grades This Term',
      value: stats.totalGrades,
      icon: FileText,
    },
  ]

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, i) => (
        <StatCard key={i} title={card.title} value={card.value} icon={card.icon} />
      ))}
    </div>
  )
}
