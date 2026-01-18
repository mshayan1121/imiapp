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
          'Total Students': summary.totalStudents,
          'Total Teachers': summary.totalTeachers,
          'Total Classes': summary.totalClasses,
          'Total Grades': summary.totalGrades,
          'Active Term': summary.activeTerm,
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <Section
        title="System Summary"
        action={
          <ExportButton
            data={exportData}
            reportType="summary"
            filename={`summary_report_${new Date().toISOString().split('T')[0]}`}
            pdfOptions={{
              title: 'System Summary Report',
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Students"
                value={summary.totalStudents}
                icon={GraduationCap}
                description="System-wide"
              />
              <StatCard
                title="Total Teachers"
                value={summary.totalTeachers}
                icon={Users}
                description="Active teachers"
              />
              <StatCard
                title="Total Classes"
                value={summary.totalClasses}
                icon={School}
                description="All classes"
              />
              <StatCard
                title="Total Grades"
                value={summary.totalGrades}
                icon={ClipboardList}
                description="Grades entered"
              />
            </div>
          )
        )}
      </Section>

      {summary && (
        <Section title="Additional Information">
          <Card className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Term:</span>
                <span className="font-medium">{summary.activeTerm}</span>
              </div>
            </div>
          </Card>
        </Section>
      )}
    </div>
  )
}
