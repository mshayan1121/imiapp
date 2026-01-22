import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'

export default function Loading() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Reports"
        description="Generate and view performance reports."
      />
      <Section>
        <Skeleton className="h-12 w-full rounded-lg" />
      </Section>
      <Section>
        <Skeleton className="h-96 w-full rounded-lg" />
      </Section>
    </PageContainer>
  )
}
