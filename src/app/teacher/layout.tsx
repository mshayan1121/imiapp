import { createClient } from '@/utils/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Suspense } from 'react'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch profile for additional details
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const fullName = profile?.full_name || 'Teacher User'
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  return (
    <DashboardShell
      sidebar={
        <Suspense fallback={<div className="w-20 bg-blue-900 h-screen" />}>
          <Sidebar role="teacher" email={user.email!} fullName={fullName} userInitials={initials} />
        </Suspense>
      }
    >
      {children}
    </DashboardShell>
  )
}
