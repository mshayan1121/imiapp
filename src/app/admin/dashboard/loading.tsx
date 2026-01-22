import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/layout/page-container'
import { Section } from '@/components/layout/section'

export default function Loading() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </Section>

      <Section>
        <Skeleton className="h-32 w-full rounded-lg" />
      </Section>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3 mt-6 sm:mt-8">
        <div className="lg:col-span-1">
          <Section>
            <Skeleton className="h-64 w-full rounded-lg" />
          </Section>
        </div>
        <div className="lg:col-span-2">
          <Section>
            <Skeleton className="h-64 w-full rounded-lg" />
          </Section>
        </div>
      </div>

      <Section>
        <Skeleton className="h-64 w-full rounded-lg" />
      </Section>

      <Section>
        <Skeleton className="h-64 w-full rounded-lg" />
      </Section>
    </PageContainer>
  )
}
