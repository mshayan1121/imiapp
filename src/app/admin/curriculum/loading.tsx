import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'

export default function Loading() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Curriculum Management"
        description="View and manage the hierarchical structure of qualifications, boards, subjects, and topics."
      />
      <div className="space-y-4 mt-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </PageContainer>
  )
}
