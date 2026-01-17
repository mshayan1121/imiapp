import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { StudentDialog } from '@/components/admin/student-dialog'
import { StudentsTable } from '@/components/admin/students-table'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'

async function StudentsTableLoader({ page, query }: { page: number; query: string }) {
  const supabase = await createClient()
  const PAGE_SIZE = 20
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Fetch all students
  let dbQuery = supabase
    .from('students')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (query) {
    dbQuery = dbQuery.ilike('name', `%${query}%`)
  }

  const { data: students, count, error } = await dbQuery

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        Error loading students: {error.message}
      </div>
    )
  }

  const pageCount = count ? Math.ceil(count / PAGE_SIZE) : 0

  return <StudentsTable data={students || []} pageCount={pageCount} currentPage={page} />
}

type Params = {
  searchParams: Promise<{
    page?: string
    query?: string
  }>
}

export default async function ManageStudentsPage(props: Params) {
  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const query = searchParams?.query || ''

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Manage Students"
        description="Add, edit, and manage student records."
        action={<StudentDialog />}
      />

      <Section>
        <Suspense key={`${page}-${query}`} fallback={<TableSkeleton />}>
          <StudentsTableLoader page={page} query={query} />
        </Suspense>
      </Section>
    </PageContainer>
  )
}
