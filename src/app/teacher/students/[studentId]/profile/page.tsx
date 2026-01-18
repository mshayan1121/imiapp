'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getStudentProfileData, 
  addStudentNote, 
  updateStudentNote, 
  deleteStudentNote,
  updateStudentContact,
  updateStudentInfo,
  getCurriculumForCourse,
  logParentContact
} from './actions'
import { upsertGrade } from '../../progress/actions'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { StatCard } from '@/components/layout/stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ChevronLeft, 
  Download, 
  Printer, 
  Edit, 
  Plus, 
  School, 
  ClipboardList, 
  AlertTriangle, 
  TrendingUp,
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  BookOpen,
  MoreVertical,
  Trash2,
  FileText,
  MapPin,
  Clock
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PageProps {
  params: Promise<{ studentId: string }>
}

export default function StudentProfilePage({ params }: PageProps) {
  const { studentId } = use(params)
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [newNote, setNewNote] = useState('')
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<any>(null)
  
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [contactForm, setContactForm] = useState<any>({})
  
  const [isStudentInfoDialogOpen, setIsStudentInfoDialogOpen] = useState(false)
  const [studentInfoForm, setStudentInfoForm] = useState<any>({})

  const [isLogContactDialogOpen, setIsLogContactDialogOpen] = useState(false)
  const [logContactForm, setLogContactForm] = useState<any>({
    contact_type: 'message',
    notes: ''
  })

  const [isAddGradeDialogOpen, setIsAddGradeDialogOpen] = useState(false)
  const [addGradeForm, setAddGradeForm] = useState<any>({
    class_id: '',
    course_id: '',
    topic_id: '',
    subtopic_id: '',
    work_type: 'classwork',
    work_subtype: 'worksheet',
    marks_obtained: '',
    total_marks: '',
    assessed_date: format(new Date(), 'yyyy-MM-dd'),
    attempt_number: 1,
    notes: ''
  })
  const [availableTopics, setAvailableTopics] = useState<any[]>([])

  useEffect(() => {
    if (studentId) {
      loadData()
    }
  }, [studentId])

  async function loadData() {
    try {
      setLoading(true)
      const res = await getStudentProfileData(studentId)
      setData(res)
      setContactForm(res.contacts[0] || {})
      setStudentInfoForm(res.student)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load student profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!data) return null

  const { student, enrolledClasses, grades, contacts, notes, activeTerm } = data

  // Stats Calculation
  const totalGrades = grades.length
  const totalLPs = grades.filter((g: any) => g.is_low_point).length
  const avgPercentage = totalGrades > 0 
    ? Math.round(grades.reduce((sum: number, g: any) => sum + g.percentage, 0) / totalGrades) 
    : 0
  
  // Flag calculation: 3 LP = 1, 4 = 2, 5+ = 3
  const flagCount = totalLPs >= 5 ? 3 : totalLPs >= 4 ? 2 : totalLPs >= 3 ? 1 : 0
  const flags = Array(flagCount).fill('🚩').join('')

  const avgColor = avgPercentage < 70 ? 'text-red-600' : avgPercentage < 80 ? 'text-yellow-600' : 'text-green-600'

  // Performance by course
  const coursePerformance = enrolledClasses.map((ec: any) => {
    const courseGrades = grades.filter((g: any) => g.course_id === ec.course_id)
    const courseAvg = courseGrades.length > 0
      ? Math.round(courseGrades.reduce((sum: number, g: any) => sum + g.percentage, 0) / courseGrades.length)
      : 0
    const courseLPs = courseGrades.filter((g: any) => g.is_low_point).length
    
    return {
      courseId: ec.course_id,
      courseName: ec.courses.name,
      qualification: ec.courses.qualifications?.name,
      board: ec.courses.boards?.name,
      gradesCount: courseGrades.length,
      lpCount: courseLPs,
      avg: courseAvg,
      status: courseAvg < 70 ? 'Struggling' : courseAvg < 80 ? 'At Risk' : 'On Track'
    }
  })

  // Struggling areas (topics with most LPs)
  const strugglingAreas = grades
    .filter((g: any) => g.is_low_point)
    .reduce((acc: any[], g: any) => {
      const existing = acc.find(a => a.topicId === g.topic_id && a.subtopicId === g.subtopic_id)
      if (existing) {
        existing.lpCount++
      } else {
        acc.push({
          topicId: g.topic_id,
          subtopicId: g.subtopic_id,
          topicName: g.topics?.name,
          subtopicName: g.subtopics?.name,
          courseName: g.courses?.name,
          lpCount: 1,
          latestGrade: g.percentage,
          latestDate: g.assessed_date
        })
      }
      return acc
    }, [])
    .sort((a, b) => b.lpCount - a.lpCount)
    .slice(0, 5)

  // Chart data
  const timelineData = [...grades]
    .reverse()
    .map((g: any) => ({
      date: format(new Date(g.assessed_date), 'dd MMM'),
      percentage: g.percentage,
      isLP: g.is_low_point,
      topic: g.topics?.name
    }))

  const barChartData = coursePerformance.map((cp: any) => ({
    name: cp.courseName,
    avg: cp.avg
  }))

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    try {
      await addStudentNote(studentId, newNote)
      setNewNote('')
      setIsNoteDialogOpen(false)
      toast.success('Note added')
      loadData()
    } catch (error) {
      toast.error('Failed to add note')
    }
  }

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.content.trim()) return
    try {
      await updateStudentNote(editingNote.id, editingNote.content)
      setEditingNote(null)
      toast.success('Note updated')
      loadData()
    } catch (error) {
      toast.error('Failed to update note')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteStudentNote(noteId, studentId)
      toast.success('Note deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete note')
    }
  }

  const handleUpdateContact = async () => {
    try {
      await updateStudentContact(studentId, contactForm)
      setIsContactDialogOpen(false)
      toast.success('Contact info updated')
      loadData()
    } catch (error) {
      toast.error('Failed to update contact info')
    }
  }

  const handleUpdateStudentInfo = async () => {
    try {
      await updateStudentInfo(studentId, studentInfoForm)
      setIsStudentInfoDialogOpen(false)
      toast.success('Student info updated')
      loadData()
    } catch (error) {
      toast.error('Failed to update student info')
    }
  }

  const handleLogContactSubmit = async () => {
    try {
      await logParentContact(studentId, logContactForm)
      setIsLogContactDialogOpen(false)
      toast.success('Parent contact logged')
      setLogContactForm({ contact_type: 'message', notes: '' })
      loadData()
    } catch (error) {
      toast.error('Failed to log contact')
    }
  }

  const handleCourseChange = async (courseId: string) => {
    const ec = enrolledClasses.find((e: any) => e.course_id === courseId)
    setAddGradeForm({
      ...addGradeForm,
      course_id: courseId,
      class_id: ec?.class_id || '',
      topic_id: '',
      subtopic_id: ''
    })
    if (courseId) {
      const topics = await getCurriculumForCourse(courseId)
      setAvailableTopics(topics)
    } else {
      setAvailableTopics([])
    }
  }

  const handleAddGradeSubmit = async () => {
    try {
      if (!addGradeForm.class_id || !addGradeForm.course_id || !addGradeForm.topic_id || !addGradeForm.marks_obtained || !addGradeForm.total_marks) {
        toast.error('Please fill in all required fields')
        return
      }

      await upsertGrade({
        ...addGradeForm,
        student_id: studentId,
        term_id: activeTerm.id,
        marks_obtained: Number(addGradeForm.marks_obtained),
        total_marks: Number(addGradeForm.total_marks)
      })

      setIsAddGradeDialogOpen(false)
      toast.success('Grade added successfully')
      loadData()
      // Reset form
      setAddGradeForm({
        class_id: '',
        course_id: '',
        topic_id: '',
        subtopic_id: '',
        work_type: 'classwork',
        work_subtype: 'worksheet',
        marks_obtained: '',
        total_marks: '',
        assessed_date: format(new Date(), 'yyyy-MM-dd'),
        attempt_number: 1,
        notes: ''
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to add grade')
    }
  }

  const headerAction = (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => setIsAddGradeDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Grade
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" /> Generate Report
      </Button>
      <Button variant="outline" size="sm" onClick={() => setIsStudentInfoDialogOpen(true)}>
        <Edit className="mr-2 h-4 w-4" /> Edit Info
      </Button>
    </div>
  )

  const breadcrumbs = (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <Link href="/teacher/classes" className="hover:text-primary">My Classes</Link>
      <ChevronLeft className="h-4 w-4 rotate-180" />
      {enrolledClasses[0] && (
        <>
          <Link href={`/teacher/classes/${enrolledClasses[0].class_id}`} className="hover:text-primary">
            {enrolledClasses[0].classes.name}
          </Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </>
      )}
      <span className="text-foreground font-medium">{student.name}</span>
      <ChevronLeft className="h-4 w-4 rotate-180" />
      <span className="text-foreground font-medium">Profile</span>
    </div>
  )

  return (
    <PageContainer className="pb-24">
      {breadcrumbs}
      <PageHeader
        title={student.name}
        subtitle={`${student.year_group} • ${student.school}`}
        action={headerAction}
      />

      {/* PART 3: STUDENT INFO CARD */}
      <Section>
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex flex-col items-center md:items-start gap-4">
                <Avatar className="h-24 w-24 text-2xl">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                    {student.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold">{student.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-1 justify-center md:justify-start">
                    <Badge variant="secondary">{student.year_group}</Badge>
                    <Badge variant="outline">{student.school}</Badge>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Active</Badge>
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-xl">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Student ID</p>
                  <p className="font-medium text-sm">{student.id.slice(0, 8)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Enrollment Date</p>
                  <p className="font-medium text-sm">{format(new Date(student.created_at), 'dd MMM yyyy')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Term</p>
                  <p className="font-medium text-sm">{activeTerm.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Classes</p>
                  <p className="font-medium text-sm">{enrolledClasses.length} Classes</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full">View Course Progress <ChevronDown className="ml-2 h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    {enrolledClasses.map((ec: any) => (
                      <DropdownMenuItem key={ec.id} asChild>
                        <Link href={`/teacher/students/${studentId}/course-progress?classId=${ec.class_id}&courseId=${ec.course_id}&termId=${activeTerm.id}`}>
                          {ec.courses.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" className="w-full" onClick={() => setIsContactDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Contact Info
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* PART 4: ACADEMIC OVERVIEW STATS */}
      <Section title="Academic Overview - Current Term">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Classes" value={enrolledClasses.length} icon={School} />
          <StatCard title="Grades Entered" value={totalGrades} icon={ClipboardList} />
          <StatCard 
            title="Low Points" 
            value={totalLPs} 
            icon={AlertTriangle} 
            className={totalLPs > 0 ? "border-red-100 bg-red-50/30" : ""}
            valueClassName={totalLPs > 0 ? "text-red-600" : ""}
          />
          <StatCard 
            title="Flags" 
            value={flagCount > 0 ? `${flags} (${flagCount})` : '0'} 
            icon={AlertTriangle}
            valueClassName={flagCount > 0 ? "text-red-600" : ""}
          />
          <StatCard 
            title="Average %" 
            value={`${avgPercentage}%`} 
            icon={TrendingUp}
            valueClassName={avgColor}
          />
        </div>
      </Section>

      {/* PART 5: FLAGGING ALERT SECTION */}
      {flagCount > 0 && (
        <Section>
          <Card className={`border-none ${
            flagCount === 3 ? 'bg-red-50 text-red-900' : 
            flagCount === 2 ? 'bg-orange-50 text-orange-900' : 
            'bg-yellow-50 text-yellow-900'
          }`}>
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
              <div className={`p-4 rounded-full ${
                flagCount === 3 ? 'bg-red-100 text-red-600' : 
                flagCount === 2 ? 'bg-orange-100 text-orange-600' : 
                'bg-yellow-100 text-yellow-600'
              }`}>
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold flex items-center gap-2 justify-center md:justify-start">
                  Student Requires Attention {flags}
                </h3>
                <p className="mt-1 font-medium">
                  {flagCount === 1 && "1 Flag (3 Low Points) - Message parents recommended"}
                  {flagCount === 2 && "2 Flags (4 Low Points) - Call parents needed"}
                  {flagCount === 3 && "3 Flags (5+ Low Points) - Meeting required"}
                </p>
                <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                  {coursePerformance.filter((cp: any) => cp.lpCount > 0).map((cp: any) => (
                    <Badge key={cp.courseId} variant="outline" className="bg-white/50 border-current">
                      {cp.courseName}: {cp.lpCount} LPs
                    </Badge>
                  ))}
                </div>
              </div>
              <Button 
                onClick={() => setIsLogContactDialogOpen(true)}
                className={
                  flagCount === 3 ? 'bg-red-600 hover:bg-red-700' : 
                  flagCount === 2 ? 'bg-orange-600 hover:bg-orange-700' : 
                  'bg-yellow-600 hover:bg-yellow-700'
                }
              >
                Log Parent Contact
              </Button>
            </CardContent>
          </Card>
        </Section>
      )}

      {/* PART 6: CLASSES & COURSES ENROLLED */}
      <Section title="Classes & Courses">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrolledClasses.length > 0 ? enrolledClasses.map((ec: any) => {
            const cp = coursePerformance.find((c: any) => c.courseId === ec.course_id)
            return (
              <Card key={ec.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg">{ec.classes.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        Teacher: {ec.classes.teacher?.raw_user_meta_data?.full_name || ec.classes.teacher?.email}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{ec.courses.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-center">
                      <div className="flex flex-col gap-1 p-2 bg-white rounded border">
                        <span className="text-muted-foreground">Grades</span>
                        <span className="text-sm font-bold">{cp.gradesCount}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-2 bg-white rounded border">
                        <span className="text-muted-foreground">LPs</span>
                        <span className={`text-sm font-bold ${cp.lpCount > 0 ? 'text-red-600' : ''}`}>{cp.lpCount}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-2 bg-white rounded border">
                        <span className="text-muted-foreground">Avg %</span>
                        <span className={`text-sm font-bold ${cp.avg < 70 ? 'text-red-600' : cp.avg < 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {cp.avg}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button asChild variant="ghost" className="w-full mt-4 text-primary">
                    <Link href={`/teacher/students/${studentId}/course-progress?classId=${ec.class_id}&courseId=${ec.course_id}&termId=${activeTerm.id}`}>
                      View Progress Report <TrendingUp className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          }) : (
            <Card className="md:col-span-2 border-dashed">
              <CardContent className="p-12 text-center space-y-4">
                <div className="p-4 bg-muted rounded-full w-fit mx-auto">
                  <School className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Not enrolled in any classes</h3>
                  <p className="text-muted-foreground">This student hasn't been added to any classes for the current term.</p>
                </div>
                <Button>Enroll in Class</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </Section>

      {/* PART 7: PERFORMANCE BY COURSE (Table) */}
      <Section title="Performance Breakdown by Course">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead className="text-center">Grades</TableHead>
                <TableHead className="text-center">Low Points</TableHead>
                <TableHead className="text-center">Average %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coursePerformance.map((cp: any) => (
                <TableRow key={cp.courseId}>
                  <TableCell className="font-medium">
                    {cp.courseName}
                    <div className="text-xs text-muted-foreground font-normal">{cp.qualification} • {cp.board}</div>
                  </TableCell>
                  <TableCell className="text-center">{cp.gradesCount}</TableCell>
                  <TableCell className={`text-center font-bold ${cp.lpCount > 0 ? 'text-red-600' : ''}`}>{cp.lpCount}</TableCell>
                  <TableCell className={`text-center font-bold ${cp.avg < 70 ? 'text-red-600' : cp.avg < 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {cp.avg}%
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      cp.status === 'Struggling' ? 'bg-red-50 text-red-700 border-red-100' :
                      cp.status === 'At Risk' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                      'bg-green-50 text-green-700 border-green-100'
                    }>
                      {cp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/teacher/students/${studentId}/course-progress?courseId=${cp.courseId}&termId=${activeTerm.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Section>

      {/* PART 8: STRUGGLING AREAS */}
      <Section title="Topics Requiring Attention">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strugglingAreas.length > 0 ? strugglingAreas.map((area: any, idx: number) => (
            <Card key={idx} className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <Badge variant="destructive" className="h-5 text-[10px]">{area.lpCount} LPs</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{area.courseName}</p>
                  <h4 className="font-bold leading-tight">{area.topicName} → {area.subtopicName}</h4>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm">
                    <span className="text-muted-foreground">Latest Grade:</span>
                    <span className="font-bold text-red-600">{area.latestGrade}%</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-4 text-xs h-8" asChild>
                  <Link href={`/teacher/students/${studentId}/course-progress?courseId=${area.courseId}&termId=${activeTerm.id}`}>
                    View in Progress Report
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )) : (
            <Card className="lg:col-span-3 bg-green-50/50 border-green-100 border-dashed">
              <CardContent className="p-8 text-center space-y-2">
                <div className="text-3xl">🎉</div>
                <h3 className="font-bold text-green-800">Great! No struggling areas this term</h3>
                <p className="text-green-600/80 text-sm">Keep up the excellent work! All grades are currently on track.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </Section>

      {/* PART 9: RECENT ACTIVITY TIMELINE */}
      <Section title="Recent Activity">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {grades.slice(0, 10).map((grade: any, idx: number) => (
                <div key={grade.id} className="relative flex items-start gap-6 group">
                  <div className={`absolute left-0 mt-1.5 h-10 w-10 rounded-full border-4 border-white flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${
                    grade.is_low_point ? 'bg-red-500' : 'bg-green-500'
                  }`}>
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                  <div className="ml-12 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(grade.assessed_date), 'dd MMM yyyy')}
                      </div>
                      <Badge className={grade.is_low_point ? 'bg-red-600' : 'bg-green-600'}>
                        {grade.is_low_point ? 'LP' : 'Pass'}
                      </Badge>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-xl group-hover:bg-muted/50 transition-colors">
                      <h4 className="font-bold text-sm">{grade.courses?.name}</h4>
                      <p className="text-sm text-muted-foreground">{grade.topics?.name} → {grade.subtopics?.name}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-bold">{grade.work_type === 'classwork' ? 'Classwork' : 'Homework'} - {grade.work_subtype}</span>
                        <span className="text-sm font-black text-primary">{grade.marks_obtained}/{grade.total_marks} ({grade.percentage}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-8" asChild>
              <Link href={`/teacher/students/${studentId}/grades`}>View All Grade History</Link>
            </Button>
          </CardContent>
        </Card>
      </Section>

      {/* PART 10: PERFORMANCE TRENDS */}
      <Section title="Performance Trends">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Grade Timeline (%)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {timelineData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={10} tickMargin={10} />
                    <YAxis domain={[0, 100]} fontSize={10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`${value}%`, 'Grade']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                  Not enough data to show trends
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Average % by Course
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} fontSize={10} />
                    <YAxis dataKey="name" type="category" width={120} fontSize={10} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                      {barChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.avg < 70 ? '#ef4444' : entry.avg < 80 ? '#f59e0b' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                  Not enough data to show course breakdown
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* PART 11: CONTACT INFORMATION */}
      <Section title="Contact Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="overflow-hidden border-l-4 border-l-primary">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Parent / Guardian
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Primary</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {contacts.length > 0 ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-none">{contacts[0].parent_name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{contacts[0].relationship}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a href={`mailto:${contacts[0].email}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</p>
                        <p className="text-sm font-medium truncate">{contacts[0].email || 'N/A'}</p>
                      </div>
                    </a>
                    <a href={`tel:${contacts[0].phone}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</p>
                        <p className="text-sm font-medium">{contacts[0].phone || 'N/A'}</p>
                      </div>
                    </a>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Preferred Method:</span>
                    </div>
                    <Badge className="bg-blue-600 capitalize">{contacts[0].preferred_contact_method || 'Email'}</Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <p className="text-muted-foreground italic text-sm">No contact information available</p>
                  <Button variant="outline" size="sm" onClick={() => setIsContactDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Contact Info
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-orange-400">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" /> Emergency & Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {contacts.length > 0 ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Address</p>
                        <p className="text-sm font-medium">
                          {contacts[0].address || 'N/A'}<br />
                          {contacts[0].city} {contacts[0].postal_code}
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-border w-full" />
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Emergency Contact</p>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold">{contacts[0].emergency_contact_name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{contacts[0].emergency_contact_relationship}</p>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 rounded-full" asChild>
                          <a href={`tel:${contacts[0].emergency_contact_phone}`}>
                            <Phone className="mr-2 h-3 w-3" /> Call
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground italic text-sm">No additional info available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* PART 12: TEACHER NOTES SECTION */}
      <Section title="Teacher Notes & Observations">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">Recent Notes</CardTitle>
            <Button size="sm" onClick={() => setIsNoteDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Note
            </Button>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {notes.length > 0 ? notes.map((note: any) => (
              <div key={note.id} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border relative group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{note.profiles?.full_name || note.profiles?.email}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(note.created_at), 'dd MMM yyyy, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingNote(note)
                          setIsNoteDialogOpen(true)
                        }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Note
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteNote(note.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Note
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            )) : (
              <div className="text-center py-12 border-dashed border-2 rounded-xl">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground italic text-sm">No teacher notes yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* QUICK ACTIONS FLOATING PANEL */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 print:hidden">
        <Dialog open={isNoteDialogOpen} onOpenChange={(open) => {
          setIsNoteDialogOpen(open)
          if (!open) setEditingNote(null)
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'Add Teacher Note'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                placeholder="Type your observation here..." 
                className="min-h-[150px] resize-none"
                value={editingNote ? editingNote.content : newNote}
                onChange={(e) => editingNote ? setEditingNote({...editingNote, content: e.target.value}) : setNewNote(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>Cancel</Button>
              <Button onClick={editingNote ? handleUpdateNote : handleAddNote}>
                {editingNote ? 'Update Note' : 'Save Note'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* EDIT STUDENT INFO DIALOG */}
      <Dialog open={isStudentInfoDialogOpen} onOpenChange={setIsStudentInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={studentInfoForm.name} 
                onChange={(e) => setStudentInfoForm({...studentInfoForm, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year_group">Year Group</Label>
              <Select 
                value={studentInfoForm.year_group} 
                onValueChange={(v) => setStudentInfoForm({...studentInfoForm, year_group: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Year 10">Year 10</SelectItem>
                  <SelectItem value="Year 11">Year 11</SelectItem>
                  <SelectItem value="Year 12">Year 12</SelectItem>
                  <SelectItem value="Year 13">Year 13</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="school">School</Label>
              <Input 
                id="school" 
                value={studentInfoForm.school} 
                onChange={(e) => setStudentInfoForm({...studentInfoForm, school: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStudentInfoDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStudentInfo}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT CONTACT INFO DIALOG */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Contact Information</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Parent / Guardian</h4>
              <div className="grid gap-2">
                <Label htmlFor="parent_name">Full Name</Label>
                <Input 
                  id="parent_name" 
                  value={contactForm.parent_name || ''} 
                  onChange={(e) => setContactForm({...contactForm, parent_name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="relationship">Relationship</Label>
                <Input 
                  id="relationship" 
                  value={contactForm.relationship || ''} 
                  onChange={(e) => setContactForm({...contactForm, relationship: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={contactForm.email || ''} 
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={contactForm.phone || ''} 
                  onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preferred">Preferred Method</Label>
                <Select 
                  value={contactForm.preferred_contact_method || 'email'} 
                  onValueChange={(v) => setContactForm({...contactForm, preferred_contact_method: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-orange-600">Emergency & Address</h4>
              <div className="grid gap-2">
                <Label htmlFor="e_name">Emergency Name</Label>
                <Input 
                  id="e_name" 
                  value={contactForm.emergency_contact_name || ''} 
                  onChange={(e) => setContactForm({...contactForm, emergency_contact_name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e_phone">Emergency Phone</Label>
                <Input 
                  id="e_phone" 
                  value={contactForm.emergency_contact_phone || ''} 
                  onChange={(e) => setContactForm({...contactForm, emergency_contact_phone: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  value={contactForm.address || ''} 
                  onChange={(e) => setContactForm({...contactForm, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    value={contactForm.city || ''} 
                    onChange={(e) => setContactForm({...contactForm, city: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postal">Postal Code</Label>
                  <Input 
                    id="postal" 
                    value={contactForm.postal_code || ''} 
                    onChange={(e) => setContactForm({...contactForm, postal_code: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateContact}>Save Contact Info</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LOG PARENT CONTACT DIALOG */}
      <Dialog open={isLogContactDialogOpen} onOpenChange={setIsLogContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Parent Contact</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Contact Type</Label>
              <Select 
                value={logContactForm.contact_type} 
                onValueChange={(v) => setLogContactForm({...logContactForm, contact_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Message / Email</SelectItem>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea 
                placeholder="What was discussed?" 
                value={logContactForm.notes}
                onChange={(e) => setLogContactForm({...logContactForm, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogContactDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogContactSubmit}>Log Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK ADD GRADE DIALOG */}
      <Dialog open={isAddGradeDialogOpen} onOpenChange={setIsAddGradeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quick Add Grade - {student.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Select Course</Label>
                <Select value={addGradeForm.course_id} onValueChange={handleCourseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {enrolledClasses.map((ec: any) => (
                      <SelectItem key={ec.course_id} value={ec.course_id}>
                        {ec.courses.name} ({ec.classes.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Topic</Label>
                <Select 
                  disabled={!addGradeForm.course_id} 
                  value={addGradeForm.topic_id} 
                  onValueChange={(v) => setAddGradeForm({...addGradeForm, topic_id: v, subtopic_id: ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTopics.map((topic: any) => (
                      <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Subtopic (Optional)</Label>
                <Select 
                  disabled={!addGradeForm.topic_id} 
                  value={addGradeForm.subtopic_id} 
                  onValueChange={(v) => setAddGradeForm({...addGradeForm, subtopic_id: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subtopic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTopics.find(t => t.id === addGradeForm.topic_id)?.subtopics.map((sub: any) => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Marks Obtained</Label>
                  <Input 
                    type="number" 
                    value={addGradeForm.marks_obtained} 
                    onChange={(e) => setAddGradeForm({...addGradeForm, marks_obtained: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Total Marks</Label>
                  <Input 
                    type="number" 
                    value={addGradeForm.total_marks} 
                    onChange={(e) => setAddGradeForm({...addGradeForm, total_marks: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Work Type</Label>
                  <Select value={addGradeForm.work_type} onValueChange={(v) => setAddGradeForm({...addGradeForm, work_type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classwork">Classwork</SelectItem>
                      <SelectItem value="homework">Homework</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Work Subtype</Label>
                  <Select value={addGradeForm.work_subtype} onValueChange={(v) => setAddGradeForm({...addGradeForm, work_subtype: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="worksheet">Worksheet</SelectItem>
                      <SelectItem value="pastpaper">Past Paper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Assessed Date</Label>
                <Input 
                  type="date" 
                  value={addGradeForm.assessed_date} 
                  onChange={(e) => setAddGradeForm({...addGradeForm, assessed_date: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label>Attempt Number</Label>
                <Input 
                  type="number" 
                  value={addGradeForm.attempt_number} 
                  onChange={(e) => setAddGradeForm({...addGradeForm, attempt_number: Number(e.target.value)})}
                />
              </div>

              <div className="grid gap-2">
                <Label>Notes (Optional)</Label>
                <Textarea 
                  className="h-[80px]" 
                  value={addGradeForm.notes} 
                  onChange={(e) => setAddGradeForm({...addGradeForm, notes: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddGradeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddGradeSubmit}>Add Grade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
