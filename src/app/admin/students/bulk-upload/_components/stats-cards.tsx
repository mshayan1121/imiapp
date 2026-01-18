import { FileText, CheckCircle, AlertTriangle, UserPlus, CheckSquare } from 'lucide-react'
import { StatCard } from '@/components/layout/stat-card'
import { StudentImportStats } from '../_types'

interface StatsCardsProps {
  stats: StudentImportStats
  selectedCount?: number
}

export function StatsCards({ stats, selectedCount }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
        title="New Students"
        value={stats.newCount}
        icon={UserPlus}
        description="Ready to import"
      />
      <StatCard
        title="Issues Found"
        value={stats.duplicateCount + stats.errorCount}
        icon={AlertTriangle}
        description={`${stats.duplicateCount} duplicates, ${stats.errorCount} errors`}
        className={stats.duplicateCount + stats.errorCount > 0 ? "bg-amber-50 border-amber-200" : ""}
      />
      <StatCard
        title="To be Added"
        value={selectedCount || 0}
        icon={CheckSquare}
        description="Selected for import"
        className="bg-blue-50 border-blue-200"
      />
    </div>
  )
}
