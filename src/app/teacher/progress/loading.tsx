import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'

export default function Loading() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Student Progress"
        description="Monitor class performance and identify at-risk students."
        action={<Skeleton className="h-10 w-[400px]" />}
      />
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </Section>
      <Section>
        <TableSkeleton columnCount={9} rowCount={8} />
      </Section>
    </PageContainer>
  )
}
