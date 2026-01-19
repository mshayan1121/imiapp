import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminDashboardData } from './actions'
import { AdminHeader } from './components/AdminHeader'
import { SystemOverviewStats } from './components/SystemOverviewStats'
import { CriticalAlerts } from './components/CriticalAlerts'
import { RecentActivityFeed } from './components/RecentActivityFeed'
import { InstitutePerformanceOverview } from './components/InstitutePerformanceOverview'
import { ClassPerformanceTable } from './components/ClassPerformanceTable'
import { TeacherActivitySummary } from './components/TeacherActivitySummary'
import { PerformanceTrends } from './components/PerformanceTrends'
import { QuickNavigation } from './components/QuickNavigation'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { PageContainer } from '@/components/layout/page-container'
import { Section } from '@/components/layout/section'

export const dynamic = 'force-dynamic'

async function AdminDashboardContent() {
  const data = await getAdminDashboardData()

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <AdminHeader activeTerm={data.activeTerm} />

      <Section>
        <QuickNavigation />
      </Section>

      <Section>
        <SystemOverviewStats stats={data.stats} />
      </Section>

      <Section title="System Alerts">
        <CriticalAlerts
          flaggedCount={data.flaggedCount}
          flagBreakdown={data.flagBreakdown}
          noActiveTerm={!data.activeTerm}
        />
      </Section>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3 mt-6 sm:mt-8">
        <div className="lg:col-span-1">
          <Section title="Recent Activity">
            <RecentActivityFeed activities={data.activities} />
          </Section>
        </div>
        <div className="lg:col-span-2">
          <Section title="Performance Overview">
            <InstitutePerformanceOverview performance={data.institutePerformance} />
          </Section>
        </div>
      </div>

      <Section title="Performance Trends">
        <PerformanceTrends data={data.performanceTrends} />
      </Section>

      <Section title="Class Performance">
        <ClassPerformanceTable data={data.classPerformance} />
      </Section>

      <Section title="Teacher Activity">
        <TeacherActivitySummary data={data.teacherSummary} />
      </Section>
    </PageContainer>
  )
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata.role !== 'admin') {
    redirect('/')
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  )
}
