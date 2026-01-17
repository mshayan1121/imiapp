import { createClient } from '@/utils/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch profile for additional details
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const fullName = profile?.full_name || 'Admin User'
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  return (
    <DashboardShell
      sidebar={
        <Sidebar role="admin" email={user.email!} fullName={fullName} userInitials={initials} />
      }
    >
      {children}
    </DashboardShell>
  )
}
