import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'

export default function Loading() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Flagged Students"
        description="Monitor and manage interventions for at-risk students."
        action={<Skeleton className="h-10 w-[200px]" />}
      />
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </Section>
      <Section>
        <TableSkeleton columnCount={7} rowCount={8} />
      </Section>
    </PageContainer>
  )
}
