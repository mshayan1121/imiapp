import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TermsTable } from '@/components/admin/terms/terms-table'
import { ActiveTermCard } from '@/components/admin/terms/active-term-card'
import { Term } from '@/components/admin/terms/columns'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'

export default async function TermsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch terms
  const { data: terms, error } = await supabase
    .from('terms')
    .select('id, name, start_date, end_date, is_active, created_at')
    .order('start_date', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching terms:', error)
  }

  const activeTerm = terms?.find((t) => t.is_active) || null

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Term Management"
        description="Manage academic terms and set the active term for the system."
      />

      <Section title="Active Term">
        <ActiveTermCard term={activeTerm as Term | null} />
      </Section>

      <Section title="All Terms">
        <TermsTable data={(terms as Term[]) || []} />
      </Section>
    </PageContainer>
  )
}
