import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function Section({ children, title, description, action, className }: SectionProps) {
  return (
    <section className={cn('mt-6 sm:mt-8 first:mt-0', className)}>
      {(title || description || action) && (
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-gray-800 tracking-tight">{title}</h2>
            )}
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  )
}
