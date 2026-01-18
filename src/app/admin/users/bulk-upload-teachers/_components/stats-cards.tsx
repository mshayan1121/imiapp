import { FileText, CheckCircle, AlertTriangle, UserPlus, Users, XCircle } from 'lucide-react'
import { StatCard } from '@/components/layout/stat-card'
import { TeacherImportStats } from '../_types'

interface StatsCardsProps {
  stats: TeacherImportStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total in File"
        value={stats.totalInFile}
        icon={FileText}
        description="Total rows processed"
      />
      <StatCard
        title="Active Status"
        value={stats.activeCount}
        icon={CheckCircle}
        description={`${stats.inactiveCount} inactive excluded`}
      />
      <StatCard
        title="Ready to Import"
        value={stats.newCount}
        icon={UserPlus}
        description="New teachers found"
        className="bg-green-50 border-green-200"
      />
      <StatCard
        title="Issues Found"
        value={stats.duplicateCount + stats.errorCount}
        icon={AlertTriangle}
        description={`${stats.duplicateCount} duplicates, ${stats.errorCount} errors`}
        className={stats.duplicateCount + stats.errorCount > 0 ? "bg-amber-50 border-amber-200" : ""}
      />
    </div>
  )
}
