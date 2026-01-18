'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Section } from '@/components/layout/section'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ExportButton } from '@/components/reports/ExportButton'
import { getFlagReport, getReportFiltersData } from '../actions'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function FlagReportView() {
  const [loading, setLoading] = useState(false)
  const [flaggedStudents, setFlaggedStudents] = useState<any[]>([])
  const [termId, setTermId] = useState('')
  const [filterOptions, setFilterOptions] = useState<{ terms: any[] }>({ terms: [] })

  useEffect(() => {
    getReportFiltersData().then((data) => {
      setFilterOptions(data)
      const activeTerm = data.terms.find((t: any) => t.is_active) || data.terms[0]
      if (activeTerm) {
        setTermId(activeTerm.id)
      }
    })
  }, [])

  useEffect(() => {
    if (!termId) return
    setLoading(true)
    getFlagReport(termId)
      .then((data) => {
        setFlaggedStudents(data || [])
      })
      .finally(() => setLoading(false))
  }, [termId])

  const exportData = flaggedStudents.map((s) => ({
    'Student Name': s.student_name || 'N/A',
    Class: s.class_name || 'N/A',
    Course: s.course_name || 'N/A',
    'Low Points': s.low_points || 0,
    'Flag Count': s.flag_count || 0,
    Status: s.status || 'N/A',
    'Contact Status': s.contacts?.some((c: any) => c.status === 'contacted') ? 'Contacted' : 'Pending',
  }))

  const selectedTerm = filterOptions.terms.find((t: any) => t.id === termId)

  return (
    <div className="space-y-6">
      <Section title="Filters">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-xs">
            <div>
              <label className="text-sm font-medium mb-2 block">Term</label>
              <Select value={termId} onValueChange={setTermId}>
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
          </div>
        </Card>
      </Section>

      <Section
        title="Flagged Students Report"
        action={
          <ExportButton
            data={exportData}
            reportType="flag"
            filename={`flag_report_${new Date().toISOString().split('T')[0]}`}
            pdfOptions={{
              title: 'Flagged Students Report',
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
                    <TableHead className="text-right">Low Points</TableHead>
                    <TableHead className="text-right">Flags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contacted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No flagged students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    flaggedStudents.map((student) => (
                      <TableRow key={student.student_id}>
                        <TableCell>{student.student_name || 'N/A'}</TableCell>
                        <TableCell>{student.class_name || 'N/A'}</TableCell>
                        <TableCell>{student.course_name || 'N/A'}</TableCell>
                        <TableCell className="text-right">{student.low_points || 0}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={student.flag_count >= 3 ? 'destructive' : 'default'}>
                            {student.flag_count}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.status || 'N/A'}</TableCell>
                        <TableCell>
                          {student.contacts?.some((c: any) => c.status === 'contacted') ? (
                            <Badge variant="outline">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
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
