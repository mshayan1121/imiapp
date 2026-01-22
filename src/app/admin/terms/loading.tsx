import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'

export default function Loading() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Term Management"
        description="Manage academic terms and set the active term for the system."
      />
      <Section>
        <Skeleton className="h-32 w-full rounded-lg" />
      </Section>
      <Section>
        <TableSkeleton columnCount={5} rowCount={6} />
      </Section>
    </PageContainer>
  )
}
