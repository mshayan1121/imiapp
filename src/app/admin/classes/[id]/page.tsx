'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getClassDetails, getClassPerformanceData } from '../actions'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { StatCard } from '@/components/layout/stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ChevronLeft, 
  Download, 
  Users, 
  TrendingUp,
  AlertCircle,
  School,
  User,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export const dynamicParams = true

export default function ClassDetailPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params?.id as string | undefined
  
  const [loading, setLoading] = useState(true)
  const [classData, setClassData] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (classId) {
      loadData()
    }
  }, [classId])

  async function loadData() {
    if (!classId) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Load class details first (required)
      const details = await getClassDetails(classId)
      setClassData(details)
      
      // Try to load performance data (optional - don't fail if this errors)
      try {
        const performance = await getClassPerformanceData(classId)
        setPerformanceData(performance)
      } catch (perfError) {
        console.warn('Failed to load performance data:', perfError)
        // Continue without performance data
      }
    } catch (err: any) {
      console.error('Error loading class data:', err)
      setError(err?.message || 'Failed to load class data')
    } finally {
      setLoading(false)
    }
  }

  if (!classId) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h2 className="text-lg font-bold">Invalid Class ID</h2>
                <p className="text-muted-foreground mt-2">The class ID could not be found in the URL.</p>
              </div>
              <Button onClick={() => router.push('/admin/classes')}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading class data...</p>
          </div>
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h2 className="text-lg font-bold">Failed to Load Class</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => loadData()}>Try Again</Button>
                <Button variant="outline" onClick={() => router.push('/admin/classes')}>Go Back</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  if (!classData) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-muted-foreground">No data available</p>
              <Button onClick={() => router.push('/admin/classes')}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  const { name, teacher_id, created_at, students } = classData
  const { avgPercentage, gradesEntered, lpCount, flagCount, studentCount, teacher } = performanceData || {}

  const exportToCSV = () => {
    const headers = ['Student Name', 'Year Group', 'School', 'Course', 'Qualification', 'Board', 'Subject']
    const csvData = (students || []).map((s: any) => [
      s.student?.name || 'N/A',
      s.student?.year_group || 'N/A',
      s.student?.school || 'N/A',
      s.course?.name || 'N/A',
      s.course?.qualification?.name || 'N/A',
      s.course?.board?.name || 'N/A',
      s.course?.subject?.name || 'N/A',
    ])

    const csvContent = [headers, ...csvData].map((e) => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${name}_students_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="min-h-[44px] min-w-[44px]"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={name || 'Class Details'}
          description={`View class details, enrolled students, and performance metrics`}
          action={
            <Button onClick={exportToCSV} variant="outline" className="min-h-[44px]">
              <Download className="mr-2 h-4 w-4" />
              Export Students
            </Button>
          }
        />
      </div>

      {/* Performance Stats */}
      {performanceData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            title="Average %"
            value={`${avgPercentage || 0}%`}
            icon={TrendingUp}
            description="Class average"
            className={cn(
              avgPercentage < 70 ? 'border-red-200 bg-red-50' :
              avgPercentage < 80 ? 'border-amber-200 bg-amber-50' :
              'border-green-200 bg-green-50'
            )}
          />
          <StatCard
            title="Grades Entered"
            value={gradesEntered || 0}
            icon={School}
            description="Total grades"
          />
          <StatCard
            title="Low Points"
            value={lpCount || 0}
            icon={AlertCircle}
            description="LP count"
            className={cn(
              lpCount > 0 ? 'border-amber-200 bg-amber-50' : ''
            )}
          />
          <StatCard
            title="Flag Count"
            value={flagCount || 0}
            icon={AlertCircle}
            description="Flagged students"
            className={cn(
              flagCount > 0 ? 'border-red-200 bg-red-50' : ''
            )}
          />
        </div>
      )}

      {/* Class Information */}
      <Section title="Class Information">
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class Name</p>
                <p className="text-lg font-semibold mt-1">{name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teacher</p>
                <p className="text-lg font-semibold mt-1">
                  {teacher?.full_name || 'Not assigned'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Students Enrolled</p>
                <p className="text-lg font-semibold mt-1">{studentCount || students?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-lg font-semibold mt-1">
                  {created_at ? format(new Date(created_at), 'MMM d, yyyy') : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Enrolled Students */}
      <Section title="Enrolled Students">
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold">Student Name</TableHead>
                    <TableHead className="font-bold">Year Group</TableHead>
                    <TableHead className="font-bold">School</TableHead>
                    <TableHead className="font-bold">Course</TableHead>
                    <TableHead className="font-bold">Qualification</TableHead>
                    <TableHead className="font-bold">Board</TableHead>
                    <TableHead className="font-bold">Subject</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!students || students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No students enrolled in this class.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((enrollment: any) => (
                      <TableRow key={enrollment.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">
                          {enrollment.student?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {enrollment.student?.year_group || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {enrollment.student?.school || 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {enrollment.course?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {enrollment.course?.qualification?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {enrollment.course?.board?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {enrollment.course?.subject?.name || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Section>
    </PageContainer>
  )
}
