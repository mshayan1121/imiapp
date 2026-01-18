'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { PerformanceReportView } from './components/PerformanceReportView'
import { GradeReportView } from './components/GradeReportView'
import { FlagReportView } from './components/FlagReportView'
import { SummaryReportView } from './components/SummaryReportView'

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('performance')

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Reports"
        description="Generate comprehensive reports on performance, grades, flags, and system activity."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="flags">Flags</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="performance">
            <PerformanceReportView />
          </TabsContent>

          <TabsContent value="grades">
            <GradeReportView />
          </TabsContent>

          <TabsContent value="flags">
            <FlagReportView />
          </TabsContent>

          <TabsContent value="summary">
            <SummaryReportView />
          </TabsContent>
        </div>
      </Tabs>
    </PageContainer>
  )
}
