import { Suspense } from 'react'
import { getDashboardData } from './actions'
import { DashboardHeader } from './components/DashboardHeader'
import { StatsCards } from './components/StatsCards'
import { FlaggedStudentsAlert } from './components/FlaggedStudentsAlert'
import { ClassPerformanceOverview } from './components/ClassPerformanceOverview'
import { RecentActivityTable } from './components/RecentActivityTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, FileText, Users, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/layout/page-container'
import { Section } from '@/components/layout/section'

export default async function TeacherDashboard() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </PageContainer>
  )
}

async function DashboardContent() {
  const data = await getDashboardData()

  if (data.noTerms) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
        <div className="bg-blue-50 p-4 rounded-full mb-6">
          <Calendar className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No School Terms Found</h2>
        <p className="text-gray-600 max-w-md mb-8">
          The dashboard requires an active school term to display data. Please contact your school administrator to set up the academic terms.
        </p>
        <div className="flex gap-4">
          <Link href="/teacher/classes">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" /> View My Classes
            </Button>
          </Link>
          <Link href="/teacher/login">
            <Button variant="ghost">Sign Out</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <DashboardHeader teacherName={data.teacherName} activeTermName={data.activeTerm.name} />

      <Section>
        <StatsCards stats={data.stats} />
      </Section>

      <div className="grid lg:grid-cols-4 gap-8 mt-8">
        <div className="lg:col-span-3">
          <Section title="Flagged Students">
            <FlaggedStudentsAlert
              flaggedCount={data.stats.flaggedCount}
              breakdown={data.flagBreakdown}
              criticalStudents={data.criticalStudents}
            />
          </Section>

          <Section title="Class Performance">
            <ClassPerformanceOverview classes={data.classPerformance} />
          </Section>

          <Section title="Recent Activity">
            <RecentActivityTable grades={data.recentGrades} />
          </Section>
        </div>

        <div className="lg:col-span-1">
          <Section title="Quick Actions">
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="flex flex-col gap-3 pt-6">
                <Link href="/teacher/grades/entry">
                  <Button variant="default" className="w-full justify-start shadow-sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Enter Grades
                  </Button>
                </Link>
                <Link href="/teacher/grades">
                  <Button
                    variant="outline"
                    className="w-full justify-start hover:bg-gray-50 border-gray-200 text-gray-700"
                  >
                    <FileText className="mr-2 h-4 w-4" /> View All Grades
                  </Button>
                </Link>
                <Link href="/teacher/classes">
                  <Button
                    variant="outline"
                    className="w-full justify-start hover:bg-gray-50 border-gray-200 text-gray-700"
                  >
                    <Users className="mr-2 h-4 w-4" /> My Classes
                  </Button>
                </Link>
                <Link href="/teacher/progress">
                  <Button
                    variant="outline"
                    className="w-full justify-start hover:bg-gray-50 border-gray-200 text-gray-700"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" /> Student Progress
                  </Button>
                </Link>
                <Link href="/teacher/progress?status=flagged">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Flagged Students
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Section>
        </div>
      </div>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </PageContainer>
  )
}
