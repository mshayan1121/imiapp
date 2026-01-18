'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Section } from '@/components/layout/section'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExportButton } from '@/components/reports/ExportButton'
import { getPerformanceReport, getReportFiltersData, ReportFilters } from '../actions'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatCard } from '@/components/layout/stat-card'
import { TrendingUp, Users, AlertCircle } from 'lucide-react'

export function PerformanceReportView() {
  const [loading, setLoading] = useState(false)
  const [performance, setPerformance] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [filters, setFilters] = useState<ReportFilters>({})
  const [filterOptions, setFilterOptions] = useState<{ terms: any[]; classes: any[] }>({ terms: [], classes: [] })

  useEffect(() => {
    getReportFiltersData().then((data) => {
      setFilterOptions(data)
      const activeTerm = data.terms.find((t: any) => t.is_active) || data.terms[0]
      if (activeTerm) {
        setFilters({ term_id: activeTerm.id })
      }
    })
  }, [])

  useEffect(() => {
    if (!filters.term_id) return
    setLoading(true)
    getPerformanceReport(filters)
      .then((result) => {
        setPerformance(result.data || [])
        setSummary(result.summary)
      })
      .finally(() => setLoading(false))
  }, [filters])

  const exportData = performance.map((p) => ({
    'Class Name': p.name || 'N/A',
    Teacher: p.teacher || 'N/A',
    'Average %': `${p.avgPercentage}%`,
    'Low Points': p.lpCount || 0,
    'Grades Count': p.gradeCount || 0,
  }))

  const selectedTerm = filterOptions.terms.find((t: any) => t.id === filters.term_id)

  return (
    <div className="space-y-6">
      <Section title="Filters">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Term</label>
              <Select
                value={filters.term_id || ''}
                onValueChange={(v) => setFilters({ ...filters, term_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.terms.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Class</label>
              <Select
                value={filters.class_id || ''}
                onValueChange={(v) => setFilters({ ...filters, class_id: v || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {filterOptions.classes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </Section>

      {summary && (
        <Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Total Classes"
              value={summary.totalClasses || 0}
              icon={Users}
              description="Included in report"
            />
            <StatCard
              title="Overall Average"
              value={`${summary.overallAvg || 0}%`}
              icon={TrendingUp}
              description="Across all classes"
            />
          </div>
        </Section>
      )}

      <Section
        title="Class Performance"
        action={
          <ExportButton
            data={exportData}
            reportType="performance"
            filename={`performance_report_${new Date().toISOString().split('T')[0]}`}
            pdfOptions={{
              title: 'Performance Report',
              term: selectedTerm?.name,
            }}
          />
        }
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="text-right">Avg %</TableHead>
                    <TableHead className="text-right">Low Points</TableHead>
                    <TableHead className="text-right">Grades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No performance data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    performance.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.name || 'N/A'}</TableCell>
                        <TableCell>{p.teacher || 'N/A'}</TableCell>
                        <TableCell className="text-right">{p.avgPercentage}%</TableCell>
                        <TableCell className="text-right">{p.lpCount || 0}</TableCell>
                        <TableCell className="text-right">{p.gradeCount || 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </Section>
    </div>
  )
}
