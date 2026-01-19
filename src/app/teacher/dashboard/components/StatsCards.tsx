import { BookOpen, Users, FileText, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/layout/stat-card'

interface StatsCardsProps {
  stats: {
    classesCount: number
    studentsCount: number
    gradesCount: number
    flaggedCount: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'My Classes',
      value: stats.classesCount,
      icon: BookOpen,
      href: '/teacher/classes',
    },
    {
      title: 'Total Students',
      value: stats.studentsCount,
      icon: Users,
      href: '/teacher/progress',
    },
    {
      title: 'Grades Entered',
      value: stats.gradesCount,
      icon: FileText,
      href: '/teacher/grades',
    },
    {
      title: 'Flagged Students',
      value: stats.flaggedCount,
      icon: AlertTriangle,
      href: '/teacher/progress',
      className: stats.flaggedCount > 0 ? 'border-red-200' : '',
    },
  ]

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.title} href={card.href} className="block group">
          <StatCard
            title={card.title}
            value={card.value}
            icon={card.icon}
            className={card.className}
          />
        </Link>
      ))}
    </div>
  )
}
