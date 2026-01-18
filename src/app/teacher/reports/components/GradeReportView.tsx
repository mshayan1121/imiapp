'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Section } from '@/components/layout/section'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExportButton } from '@/components/reports/ExportButton'
import { getGradeReport, getReportFiltersData, ReportFilters } from '../actions'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function GradeReportView() {
  const [loading, setLoading] = useState(false)
  const [grades, setGrades] = useState<any[]>([])
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
    getGradeReport(filters)
      .then((result) => {
        setGrades(result.data || [])
      })
      .finally(() => setLoading(false))
  }, [filters])

  const exportData = grades.map((g) => ({
    'Student Name': g.students?.name || 'N/A',
    Class: g.classes?.name || 'N/A',
    Course: g.courses?.name || 'N/A',
    Topic: g.topics?.name || 'N/A',
    'Marks Obtained': g.marks_obtained,
    'Total Marks': g.total_marks,
    Percentage: `${g.percentage}%`,
    'Low Point': g.is_low_point ? 'Yes' : 'No',
    'Work Type': g.work_type,
    'Assessment Date': g.assessed_date,
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
                  <SelectValue placeholder="All My Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All My Classes</SelectItem>
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

      <Section
        title="Grade Report"
        action={
          <ExportButton
            data={exportData}
            reportType="grade"
            filename={`grade_report_${new Date().toISOString().split('T')[0]}`}
            pdfOptions={{
              title: 'Grade Report',
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
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead className="text-right">Marks</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No grades found
                      </TableCell>
                    </TableRow>
                  ) : (
                    grades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell>{grade.students?.name || 'N/A'}</TableCell>
                        <TableCell>{grade.classes?.name || 'N/A'}</TableCell>
                        <TableCell>{grade.courses?.name || 'N/A'}</TableCell>
                        <TableCell>{grade.topics?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {grade.marks_obtained}/{grade.total_marks}
                        </TableCell>
                        <TableCell className="text-right">{grade.percentage}%</TableCell>
                        <TableCell>{new Date(grade.assessed_date).toLocaleDateString()}</TableCell>
                        <TableCell>{grade.work_type}</TableCell>
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
