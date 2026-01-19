import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  action?: ReactNode
  className?: string
  children?: ReactNode
}

export function PageHeader({
  title,
  subtitle,
  description,
  action,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4',
        className,
      )}
    >
      <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">{subtitle}</p>
        )}
        {description && (
          <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
