import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('max-w-[1600px] mx-auto px-[28px] py-4 sm:py-6 lg:py-8', className)}>
      {children}
    </div>
  )
}
