'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-container'
import { Section } from '@/components/layout/section'
import { StudentDirectoryTable } from '@/components/students/student-directory-table'
import { StudentFilters } from '@/components/students/student-filters'
import { StudentStats } from '@/components/students/student-stats'
import { StudentDirectoryFilters, StudentWithStats } from '@/types/students'
import { getDirectoryData } from './actions'
import { toast } from 'sonner'
import { deleteStudent, bulkDeleteStudents } from '@/app/admin/students/actions'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToCSV } from '@/utils/export-csv'
import { StudentDialog } from '@/components/admin/student-dialog'

interface AdminDirectoryClientProps {
  initialData: {
    students: StudentWithStats[]
    count: number
  }
  filterOptions: {
    schools: string[]
    yearGroups: string[]
    classes: Array<{ id: string; name: string }>
  }
}

export function AdminDirectoryClient({
  initialData,
  filterOptions,
}: AdminDirectoryClientProps) {
  const [students, setStudents] = useState<StudentWithStats[]>(initialData.students)
  const [totalCount, setTotalCount] = useState(initialData.count)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<StudentDirectoryFilters>({
    search: '',
    year_group: '',
    school: '',
    class_id: '',
    course_id: '',
    enrollment_status: '',
    performance: '',
    flag_status: '',
  })

  const fetchData = useCallback(async (currentFilters: StudentDirectoryFilters, page: number) => {
    setLoading(true)
    try {
      const result = await getDirectoryData(currentFilters, page, 20, 'admin')
      if (result.error) {
        toast.error(result.error)
      } else {
        setStudents(result.students)
        setTotalCount(result.count)
      }
    } catch (error) {
      toast.error('Failed to fetch student data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(filters, currentPage)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, currentPage, fetchData])

  const handleFilterChange = (newFilters: StudentDirectoryFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      year_group: '',
      school: '',
      class_id: '',
      course_id: '',
      enrollment_status: '',
      performance: '',
      flag_status: '',
    })
    setCurrentPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return
    
    const result = await deleteStudent(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Student deleted successfully')
      fetchData(filters, currentPage)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} students? This action cannot be undone.`)) return
    
    const result = await bulkDeleteStudents(ids)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${ids.length} students deleted successfully`)
      fetchData(filters, currentPage)
    }
  }

  const handleExport = () => {
    const exportData = students.map(s => ({
      'Student Name': s.name,
      'Year Group': s.year_group,
      'School': s.school,
      'Classes': s.class_students.map(cs => cs.class.name).join(', '),
      'Total Grades': s.stats.total_grades,
      'Low Points': s.stats.low_points,
      'Flags': s.stats.flag_count,
      'Average %': `${s.stats.average_percentage.toFixed(1)}%`,
      'Status': s.stats.status,
    }))
    
    exportToCSV(exportData, `student-directory-${new Date().toISOString().split('T')[0]}`)
    toast.success('Exporting student list to CSV...')
  }

  return (
    <PageContainer>
      <PageHeader
        title="Student Directory"
        description="View and manage all students across the institute"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export List
            </Button>
            <StudentDialog />
          </div>
        }
      />

      <StudentStats students={students} totalCount={totalCount} />

      <StudentFilters
        role="admin"
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        availableSchools={filterOptions.schools}
        availableYearGroups={filterOptions.yearGroups}
        availableClasses={filterOptions.classes}
      />

      <Section>
        <StudentDirectoryTable
          role="admin"
          data={students}
          currentPage={currentPage}
          pageCount={Math.ceil(totalCount / 20)}
          onPageChange={setCurrentPage}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
        />
      </Section>
    </PageContainer>
  )
}
