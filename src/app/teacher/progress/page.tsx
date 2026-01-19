'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getFiltersData } from '../grades/actions'
import { getClassProgress } from './actions'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Download, Eye, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { exportToCSV } from '@/utils/export-csv'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { StatCard } from '@/components/layout/stat-card'
import { useSearchParams } from 'next/navigation'

function ProgressContent() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status')
  
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ class_id: '', term_id: '' })
  const [terms, setTerms] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [progressData, setProgressData] = useState<any[]>([])

  useEffect(() => {
    getFiltersData().then(({ terms, classes }) => {
      setTerms(terms || [])
      setClasses(classes || [])
      const activeTerm = terms?.find((t: any) => t.is_active) || terms?.[0]
      if (activeTerm) {
        setFilters(prev => ({ ...prev, term_id: activeTerm.id }))
      }
    })
  }, [])

  const fetchProgress = useCallback(async () => {
    if (filters.class_id && filters.term_id) {
      setLoading(true)
      try {
        const data = await getClassProgress(filters.class_id, filters.term_id)
        setProgressData(data)
      } finally {
        setLoading(false)
      }
    }
  }, [filters.class_id, filters.term_id])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  const filteredData = progressData.filter(student => {
    if (statusFilter === 'flagged') {
      return student.flag_count > 0
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Meeting Required':
        return <Badge variant="danger" className="gap-1.5">CRITICAL</Badge>
      case 'Call Parents':
        return <Badge variant="warning" className="gap-1.5 text-orange-700 bg-orange-100 border-orange-200">WARNING</Badge>
      case 'Message Parents':
        return <Badge variant="warning" className="gap-1.5">AT RISK</Badge>
      default:
        return <Badge variant="success" className="gap-1.5">ON TRACK</Badge>
    }
  }

  const handleExport = () => {
    const exportData = filteredData.map(p => ({
      'Student Name': p.student_name,
      'Year Group': p.year_group,
      'Course': p.course_name,
      'Total Grades': p.total_grades,
      'Low Points': p.low_points,
      'Flags': p.flag_count,
      'Average %': p.average_percentage,
      'Status': p.status
    }))
    exportToCSV(exportData, `Class_Progress_${new Date().toISOString().split('T')[0]}`)
  }

  const action = (
    <div className="flex items-center gap-3">
      <div className="w-[180px]">
        <Select 
          value={filters.class_id} 
          onValueChange={(v) => setFilters({ ...filters, class_id: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-[180px]">
        <Select 
          value={filters.term_id} 
          onValueChange={(v) => setFilters({ ...filters, term_id: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Term" />
          </SelectTrigger>
          <SelectContent>
            {terms.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button 
        variant="outline" 
        disabled={!filteredData.length}
        onClick={handleExport}
        className="border-gray-200"
      >
        <Download className="mr-2 h-4 w-4" /> Export
      </Button>
    </div>
  )

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title={statusFilter === 'flagged' ? "Flagged Students" : "Student Progress"}
        description={statusFilter === 'flagged' ? "Review students who require attention." : "Monitor class performance and identify at-risk students."}
        action={action}
      />

      {/* Overview Stats */}
      {progressData.length > 0 && !statusFilter && (
        <Section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="On Track"
              value={`${progressData.filter(p => p.flag_count === 0).length} Students`}
              icon={CheckCircle2}
              className="border-green-100"
            />
            <StatCard
              title="At Risk"
              value={`${progressData.filter(p => p.flag_count === 1 || p.flag_count === 2).length} Students`}
              icon={AlertTriangle}
              className="border-yellow-100"
            />
            <StatCard
              title="Critical"
              value={`${progressData.filter(p => p.flag_count >= 3).length} Students`}
              icon={Flag}
              className="border-red-100"
            />
          </div>
        </Section>
      )}

      <Section title={statusFilter === 'flagged' ? "Flagged Summary" : "Progress Summary"}>
        {loading ? (
          <TableSkeleton />
        ) : !filters.class_id ? (
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <EmptyState 
              icon={Eye}
              title="Select a Class"
              description="Choose a class and term from the filters above to view student progress summaries."
            />
          </Card>
        ) : filteredData.length === 0 ? (
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <EmptyState 
              icon={AlertTriangle}
              title={statusFilter === 'flagged' ? "No Flagged Students" : "No Progress Data"}
              description={statusFilter === 'flagged' ? "Great! No students currently have flags in this class." : "No assessment data found for the selected class and term."}
            />
          </Card>
        ) : (
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Student Name</TableHead>
                  <TableHead className="w-[100px]">Year Group</TableHead>
                  <TableHead className="w-[200px]">Course</TableHead>
                  <TableHead className="w-[100px] text-center">Total Grades</TableHead>
                  <TableHead className="w-[100px] text-center">Low Points</TableHead>
                  <TableHead className="w-[100px] text-center">Flags</TableHead>
                  <TableHead className="w-[100px] text-center">Average %</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((student) => (
                  <TableRow key={student.student_id} className="group hover:bg-gray-50/50">
                    <TableCell className="font-semibold text-gray-900">{student.student_name}</TableCell>
                    <TableCell className="text-gray-600">{student.year_group}</TableCell>
                    <TableCell className="text-xs text-gray-500 max-w-[150px]">{student.course_name}</TableCell>
                    <TableCell className="text-center font-medium">{student.total_grades}</TableCell>
                    <TableCell className="text-center">
                      {student.low_points > 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-700 font-bold text-xs">
                          {student.low_points}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-0.5">
                        {Array.from({ length: student.flag_count }).map((_, i) => (
                          <Flag key={i} className="h-3.5 w-3.5 text-red-500 fill-current" />
                        ))}
                        {student.flag_count === 0 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900">
                      {student.average_percentage}%
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(student.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="h-8 px-3 hover:bg-gray-100">
                        <Link href={`/teacher/progress/${student.student_id}?term=${filters.term_id}`}>
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </Section>
    </PageContainer>
  )
}

export default function ClassProgressPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ProgressContent />
    </Suspense>
  )
}
