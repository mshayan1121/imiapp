import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  className?: string
  valueClassName?: string
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  className,
  valueClassName
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'bg-white border border-gray-200 rounded-lg shadow-sm p-6 relative overflow-hidden',
        className,
      )}
    >
      <div className="flex flex-col space-y-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-baseline space-x-2">
          <h3 className={cn("text-3xl font-bold text-gray-900 tracking-tight", valueClassName)}>{value}</h3>
        </div>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="absolute top-6 right-6 bg-blue-50 text-blue-600 rounded-full p-2.5">
        <Icon className="w-5 h-5" />
      </div>
    </Card>
  )
}
