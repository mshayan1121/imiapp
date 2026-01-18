'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-container'
import { Section } from '@/components/layout/section'
import { StudentDirectoryTable } from '@/components/students/student-directory-table'
import { StudentFilters } from '@/components/students/student-filters'
import { StudentStats } from '@/components/students/student-stats'
import { StudentDirectoryFilters, StudentWithStats } from '@/types/students'
import { getDirectoryData } from '@/app/admin/students/directory/actions'
import { toast } from 'sonner'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TeacherDirectoryClientProps {
  teacherId: string
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

export function TeacherDirectoryClient({
  teacherId,
  initialData,
  filterOptions,
}: TeacherDirectoryClientProps) {
  const router = useRouter()
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
      const result = await getDirectoryData(currentFilters, page, 20, 'teacher', teacherId)
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
  }, [teacherId])

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

  return (
    <PageContainer>
      <PageHeader
        title="My Students"
        description="View students from all your classes"
        action={
          <Button onClick={() => router.push('/teacher/grades/entry')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Grade
          </Button>
        }
      />

      <StudentStats students={students} totalCount={totalCount} />

      <StudentFilters
        role="teacher"
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        availableSchools={filterOptions.schools}
        availableYearGroups={filterOptions.yearGroups}
        availableClasses={filterOptions.classes}
      />

      <Section>
        <StudentDirectoryTable
          role="teacher"
          data={students}
          currentPage={currentPage}
          pageCount={Math.ceil(totalCount / 20)}
          onPageChange={setCurrentPage}
          onAddGrade={(id) => router.push(`/teacher/grades/entry?studentId=${id}`)}
        />
      </Section>
    </PageContainer>
  )
}
