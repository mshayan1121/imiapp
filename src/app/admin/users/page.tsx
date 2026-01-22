import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { AddTeacherDialog } from '@/components/admin/add-teacher-dialog'
import { AddAdminDialog } from '@/components/admin/add-admin-dialog'
import { BulkUploadDialog } from '@/components/admin/bulk-upload-dialog'
import { UsersTable } from '@/components/admin/users-table'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'

async function UsersTableLoader() {
  const supabase = await createClient()

  // Fetch all profiles
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        Error loading users: {error.message}
      </div>
    )
  }

  return <UsersTable users={users || []} />
}

export default function ManageUsersPage() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Manage Users"
        description="View and manage admin and teacher accounts."
        action={
          <div className="flex gap-2">
            <BulkUploadDialog />
            <AddAdminDialog />
            <AddTeacherDialog />
          </div>
        }
      />

      <Section>
        <Suspense fallback={<TableSkeleton />}>
          <UsersTableLoader />
        </Suspense>
      </Section>
    </PageContainer>
  )
}
