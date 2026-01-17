import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in duration-500',
        className,
      )}
    >
      {Icon && (
        <div className="bg-gray-50 p-6 rounded-full mb-6">
          <Icon className="h-12 w-12 text-gray-300" />
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-500 max-w-sm mb-8">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="shadow-sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
