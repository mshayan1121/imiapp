import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8', className)}>
      {children}
    </div>
  )
}
