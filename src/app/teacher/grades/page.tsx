'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GradeHistoryTable } from './components/grade-history-table'
import { GradeFilters } from './components/grade-filters'
import { getGrades, getGradeStats, getFiltersData } from './actions'
import { Loader2, GraduationCap, AlertCircle, BarChart3, Clock } from 'lucide-react'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { Grade, GradeFiltersState, Term, Class } from '@/types/grades'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { StatCard } from '@/components/layout/stat-card'

export default function TeacherGradesPage() {
  const [loading, setLoading] = useState(true)
  const [grades, setGrades] = useState<Grade[]>([])
  const [stats, setStats] = useState({ total: 0, lowPoints: 0, average: 0 })
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [filters, setFilters] = useState<GradeFiltersState>({
    class_id: '',
    term_id: '',
    student_id: '',
    work_type: 'all',
    topic_id: '',
    subtopic_id: '',
  })
  const [terms, setTerms] = useState<Term[]>([])
  const [classes, setClasses] = useState<Class[]>([])

  const loadInitialData = async () => {
    try {
      const { terms, classes } = await getFiltersData()
      setTerms((terms || []) as Term[])
      setClasses((classes || []) as Class[])

      const activeTerm = terms?.find((t) => t.is_active) || terms?.[0]
      if (activeTerm) {
        setFilters((prev) => ({ ...prev, term_id: activeTerm.id }))
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

  const fetchData = useCallback(async () => {
    if (!filters.term_id) return
    setLoading(true)
    try {
      const [gradesResponse, statsData] = await Promise.all([
        getGrades({ ...filters, page }),
        getGradeStats(filters.term_id),
      ])

      const { data: gradesData, count } = gradesResponse
      setGrades(gradesData || [])
      setStats(statsData)
      setPageCount(Math.ceil((count || 0) / 20))
    } catch (error) {
      console.error('Error fetching grades:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Grade History"
        description="View, edit, and manage your students' assessment history."
      />

      {/* Quick Stats */}
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Grades"
            value={stats.total}
            icon={GraduationCap}
            description="This term"
          />
          <StatCard
            title="Low Points"
            value={stats.lowPoints}
            icon={AlertCircle}
            description="Below 80%"
            className="border-red-100"
          />
          <StatCard
            title="Average"
            value={`${stats.average}%`}
            icon={BarChart3}
            description="Class average"
          />
          <StatCard title="Pending Retakes" value="-" icon={Clock} description="Coming soon" />
        </div>
      </Section>

      {/* Filters */}
      <Section title="Filters">
        <GradeFilters filters={filters} setFilters={setFilters} terms={terms} classes={classes} />
      </Section>

      {/* Grades Table */}
      <Section title="Grades List">
        {loading ? (
          <TableSkeleton />
        ) : (
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <GradeHistoryTable data={grades} onUpdate={fetchData} />
            <div className="flex items-center justify-end space-x-2 p-4 border-t">
              <div className="flex-1 text-sm text-muted-foreground">
                Page {page} of {pageCount || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
              >
                Next
              </Button>
            </div>
          </Card>
        )}
      </Section>
    </PageContainer>
  )
}
