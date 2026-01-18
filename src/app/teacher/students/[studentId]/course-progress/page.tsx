'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCourseProgressData, upsertGrade, deleteGradeAction } from '../../progress/actions'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { StatCard } from '@/components/layout/stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ChevronLeft, 
  Download, 
  Printer, 
  Plus, 
  Book, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  MoreVertical,
  Edit2,
  Trash2,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  User
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { GradeForm } from './components/GradeForm'
import { DeleteGradeDialog } from './components/DeleteGradeDialog'

interface PageProps {
  params: Promise<{ studentId: string }>
}

export default function StudentCourseProgressPage({ params }: PageProps) {
  const { studentId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const classId = searchParams.get('classId')
  const courseId = searchParams.get('courseId')
  const termId = searchParams.get('termId') // Assuming termId is passed or we need to fetch it

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [expandedTopics, setExpandedTopics] = useState<string[]>([])
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<any>(null)
  const [gradeDialogType, setGradeDialogType] = useState<{
    topicId: string;
    subtopicId: string | null;
    topicName: string;
    subtopicName?: string;
  } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [gradeToDelete, setGradeToDelete] = useState<any>(null)
  const [filters, setFilters] = useState({
    workType: 'all',
    status: 'all',
  })

  useEffect(() => {
    if (studentId && classId && courseId && termId) {
      loadData()
    }
  }, [studentId, classId, courseId, termId])

  async function loadData() {
    try {
      setLoading(true)
      const res = await getCourseProgressData(studentId, classId!, courseId!, termId!)
      setData(res)
      // Auto-expand topics that have grades
      const topicsWithGrades = res.topics
        .filter((t: any) => 
          res.grades.some((g: any) => g.topic_id === t.id)
        )
        .map((t: any) => t.id)
      setExpandedTopics(topicsWithGrades)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div> // Replace with Skeleton later
  }

  if (!data) return null

  const { studentInfo, topics, grades: allGrades } = data

  const grades = allGrades.filter((g: any) => {
    if (filters.workType !== 'all' && g.work_type !== filters.workType) return false
    if (filters.status === 'pass' && g.is_low_point) return false
    if (filters.status === 'lp' && !g.is_low_point) return false
    return true
  })

  const classStudent = studentInfo.class_students[0]
  const course = classStudent.courses
  const className = classStudent.classes.name

  // Stats Calculation
  const totalGrades = grades.length
  const lowPoints = grades.filter((g: any) => g.is_low_point).length
  const avgPercentage = totalGrades > 0 
    ? Math.round(grades.reduce((acc: number, g: any) => acc + Number(g.percentage), 0) / totalGrades) 
    : 0
  
  const flagCount = lowPoints >= 5 ? 3 : lowPoints >= 4 ? 2 : lowPoints >= 3 ? 1 : 0
  const flags = Array(flagCount).fill('🚩').join('')

  const avgColor = avgPercentage < 70 ? 'text-red-600' : avgPercentage < 80 ? 'text-yellow-600' : 'text-green-600'

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => 
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    )
  }

  const handleAddGrade = (topic: any, subtopic?: any) => {
    setGradeDialogType({
      topicId: topic.id,
      subtopicId: subtopic?.id || null,
      topicName: topic.name,
      subtopicName: subtopic?.name
    })
    setSelectedGrade(null)
    setIsGradeDialogOpen(true)
  }

  const handleEditGrade = (grade: any) => {
    const topic = topics.find((t: any) => t.id === grade.topic_id)
    const subtopic = topic?.subtopics?.find((s: any) => s.id === grade.subtopic_id)
    
    setGradeDialogType({
      topicId: grade.topic_id,
      subtopicId: grade.subtopic_id,
      topicName: topic?.name || '',
      subtopicName: subtopic?.name
    })
    setSelectedGrade(grade)
    setIsGradeDialogOpen(true)
  }

  const handleDeleteGrade = (grade: any) => {
    setGradeToDelete(grade)
    setIsDeleteDialogOpen(true)
  }

  const onGradeSubmit = async (formData: any) => {
    try {
      await upsertGrade({
        ...formData,
        student_id: studentId,
        class_id: classId,
        course_id: courseId,
        term_id: termId,
      })
      toast.success(selectedGrade ? 'Grade updated' : 'Grade added')
      setIsGradeDialogOpen(false)
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Failed to save grade')
    }
  }

  const onConfirmDelete = async () => {
    if (!gradeToDelete) return
    try {
      await deleteGradeAction(gradeToDelete.id)
      toast.success('Grade deleted')
      setIsDeleteDialogOpen(false)
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete grade')
    }
  }

  const headerAction = (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/teacher/students/${studentId}/profile`}>
          <User className="mr-2 h-4 w-4" /> View Full Profile
        </Link>
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" /> Export Report
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/teacher/classes/${classId}`}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Class
        </Link>
      </Button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={studentInfo.name}
        subtitle={`${studentInfo.year_group} • ${studentInfo.school} • ${className}`}
        action={headerAction}
      >
        <div className="flex items-center gap-4 mt-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Course</span>
            <span className="font-semibold">{course.name}</span>
            <span className="text-xs text-muted-foreground">
              {course.boards?.name} • {course.qualifications?.name}
            </span>
          </div>
          <div className="h-10 w-[1px] bg-border mx-2" />
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
            Current Term
          </Badge>
        </div>
      </PageHeader>

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Grades" value={totalGrades} icon={FileText} />
          <StatCard 
            title="Total Low Points" 
            value={lowPoints} 
            icon={AlertTriangle} 
            className="border-red-100 bg-red-50/30"
            valueClassName="text-red-600"
          />
          <StatCard 
            title="Flags" 
            value={flagCount > 0 ? `${flags} (${flagCount})` : '0'} 
            icon={AlertTriangle}
            valueClassName={flagCount > 0 ? 'text-red-600' : ''}
          />
          <StatCard 
            title="Average %" 
            value={`${avgPercentage}%`} 
            icon={TrendingUp}
            valueClassName={avgColor}
          />
        </div>
      </Section>

      <Section>
        <Card className="bg-muted/30 border-none shadow-none">
          <CardContent className="p-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Work Type</span>
              <Select value={filters.workType} onValueChange={(v) => setFilters(prev => ({ ...prev, workType: v }))}>
                <SelectTrigger className="w-[180px] h-9 bg-background">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="classwork">Classwork</SelectItem>
                  <SelectItem value="homework">Homework</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Grade Status</span>
              <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                <SelectTrigger className="w-[180px] h-9 bg-background">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pass">Pass Only</SelectItem>
                  <SelectItem value="lp">Low Points Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-6 text-muted-foreground"
              onClick={() => setFilters({ workType: 'all', status: 'all' })}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      </Section>

      <Section title="Curriculum Progress" className="mt-8">
        <div className="space-y-4">
          {topics.map((topic: any) => {
            const topicGrades = grades.filter((g: any) => g.topic_id === topic.id)
            const topicLP = topicGrades.filter((g: any) => g.is_low_point).length
            const isExpanded = expandedTopics.includes(topic.id)
            
            return (
              <Card key={topic.id} className="overflow-hidden border-l-4 border-l-primary/20">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleTopic(topic.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Book className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {topic.name}
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {topicGrades.length} grades entered
                        </span>
                        {topicLP > 0 && (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <AlertTriangle className="h-3 w-3" /> {topicLP} Low Points
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddGrade(topic)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Grade
                  </Button>
                </div>

                <Collapsible open={isExpanded}>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-6 px-6">
                      <div className="mt-4 space-y-6">
                        {/* Topic Level Grades */}
                        <div className="space-y-2">
                          {topicGrades.filter((g: any) => !g.subtopic_id).map((grade: any) => (
                            <GradeItem 
                              key={grade.id} 
                              grade={grade} 
                              onEdit={() => handleEditGrade(grade)}
                              onDelete={() => handleDeleteGrade(grade)}
                              isTopicLevel
                            />
                          ))}
                        </div>

                        {/* Subtopics */}
                        <div className="ml-6 space-y-6 border-l-2 border-muted pl-6 mt-6">
                          {topic.subtopics.map((subtopic: any) => {
                            const subtopicGrades = topicGrades.filter((g: any) => g.subtopic_id === subtopic.id)
                            return (
                              <div key={subtopic.id} className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {subtopic.name}
                                  </h4>
                                  <Button 
                                    variant="ghost" 
                                    size="xs" 
                                    className="h-8 text-xs"
                                    onClick={() => handleAddGrade(topic, subtopic)}
                                  >
                                    <Plus className="mr-1 h-3 w-3" /> Add Grade
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {subtopicGrades.map((grade: any) => (
                                    <GradeItem 
                                      key={grade.id} 
                                      grade={grade} 
                                      onEdit={() => handleEditGrade(grade)}
                                      onDelete={() => handleDeleteGrade(grade)}
                                    />
                                  ))}
                                  {subtopicGrades.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic pl-6">No grades entered yet</p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          })}
        </div>
      </Section>

      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedGrade ? 'Edit Grade' : 'Add Grade'} for {gradeDialogType?.subtopicName || gradeDialogType?.topicName}
            </DialogTitle>
          </DialogHeader>
          {gradeDialogType && (
            <GradeForm 
              initialData={selectedGrade}
              topicName={gradeDialogType.topicName}
              subtopicName={gradeDialogType.subtopicName}
              topicId={gradeDialogType.topicId}
              subtopicId={gradeDialogType.subtopicId}
              studentName={studentInfo.name}
              className={className}
              courseName={course.name}
              existingGrades={grades.filter((g: any) => 
                g.topic_id === gradeDialogType.topicId && 
                g.subtopic_id === gradeDialogType.subtopicId
              )}
              onSubmit={onGradeSubmit}
              onCancel={() => setIsGradeDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteGradeDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
        grade={gradeToDelete}
        onConfirm={onConfirmDelete}
      />
    </PageContainer>
  )
}

function GradeItem({ grade, onEdit, onDelete, isTopicLevel }: { grade: any, onEdit: () => void, onDelete: () => void, isTopicLevel?: boolean }) {
  const isLP = grade.is_low_point
  const statusColor = isLP ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
  const badgeColor = isLP ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'
  
  return (
    <div className={`group flex items-center justify-between p-3 rounded-lg border ${statusColor} transition-all hover:shadow-sm`}>
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${isLP ? 'bg-red-100' : 'bg-green-100'}`}>
          {isLP ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm capitalize">{grade.work_type} - {grade.work_subtype}</span>
            {isTopicLevel && <Badge variant="outline" className="text-[10px] uppercase h-5">Topic Grade</Badge>}
            {grade.attempt_number > 1 && <Badge variant="outline" className="text-[10px] uppercase h-5">Retake {grade.attempt_number}</Badge>}
          </div>
          <div className="flex items-center gap-3 text-sm mt-0.5">
            <span className="font-bold">{grade.marks_obtained}/{grade.total_marks} ({grade.percentage}%)</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">{format(new Date(grade.assessed_date), 'dd MMM yyyy')}</span>
            {isLP && <Badge className="bg-red-600 text-white border-none h-5 text-[10px]">LP</Badge>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
