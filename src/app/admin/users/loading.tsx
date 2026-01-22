import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Manage Users"
        description="View and manage admin and teacher accounts."
        action={<Skeleton className="h-10 w-[200px]" />}
      />
      <Section>
        <TableSkeleton columnCount={5} rowCount={8} />
      </Section>
    </PageContainer>
  )
}
