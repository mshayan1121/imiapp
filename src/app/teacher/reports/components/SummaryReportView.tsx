'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Section } from '@/components/layout/section'
import { StatCard } from '@/components/layout/stat-card'
import { ExportButton } from '@/components/reports/ExportButton'
import { getSummaryReport } from '../actions'
import { Loader2, Users, GraduationCap, School, ClipboardList } from 'lucide-react'

export function SummaryReportView() {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    setLoading(true)
    getSummaryReport()
      .then((data) => {
        setSummary(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const exportData = summary
    ? [
        {
          'My Classes': summary.classesCount,
          'My Students': summary.studentsCount,
          'Grades Entered': summary.gradesCount,
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <Section
        title="Activity Summary"
        action={
          <ExportButton
            data={exportData}
            reportType="summary"
            filename={`summary_report_${new Date().toISOString().split('T')[0]}`}
            pdfOptions={{
              title: 'Activity Summary Report',
            }}
          />
        }
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="My Classes"
                value={summary.classesCount}
                icon={School}
                description="Classes you teach"
              />
              <StatCard
                title="My Students"
                value={summary.studentsCount}
                icon={GraduationCap}
                description="Unique students"
              />
              <StatCard
                title="Grades Entered"
                value={summary.gradesCount}
                icon={ClipboardList}
                description="Total grades"
              />
            </div>
          )
        )}
      </Section>
    </div>
  )
}
