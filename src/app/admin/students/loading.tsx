import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Students"
        description="Manage student information and profiles."
        action={<Skeleton className="h-10 w-[120px]" />}
      />
      <Section>
        <TableSkeleton columnCount={6} rowCount={10} />
      </Section>
    </PageContainer>
  )
}
