'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getFlaggedStudents, updateContactStatus } from './actions'
import { getFiltersData } from '../../teacher/grades/actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Flag,
  MessageSquare,
  Phone,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportToCSV } from '@/utils/export-csv'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { StatCard } from '@/components/layout/stat-card'

export default function AdminFlagsPage() {
  const [loading, setLoading] = useState(false)
  const [termId, setTermId] = useState('')
  const [terms, setTerms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [filterLevel, setFilterLevel] = useState('all')

  useEffect(() => {
    getFiltersData().then(({ terms }) => {
      setTerms(terms || [])
      const activeTerm = terms?.find((t) => t.is_active) || terms?.[0]
      if (activeTerm) {
        setTermId(activeTerm.id)
      }
    })
  }, [])

  const fetchData = async () => {
    if (!termId) return
    setLoading(true)
    try {
      const data = await getFlaggedStudents(termId)
      setStudents(data)
    } catch (error) {
      toast.error('Failed to fetch flagged students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [termId])

  const handleStatusUpdate = async (studentId: string, type: any, status: any) => {
    try {
      await updateContactStatus({
        student_id: studentId,
        term_id: termId,
        contact_type: type,
        status: status,
      })
      toast.success('Status updated')
      fetchData()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const filteredStudents = students.filter((s) => {
    if (filterLevel === 'all') return true
    if (filterLevel === '1') return s.flag_count === 1
    if (filterLevel === '2') return s.flag_count === 2
    if (filterLevel === '3') return s.flag_count >= 3
    return true
  })

  const handleExport = () => {
    const exportData = filteredStudents.map((s) => ({
      'Student Name': s.student_name,
      Class: s.class_name || 'Mathematics 11A',
      Course: s.course_name,
      'LP Count': s.low_points,
      'Flag Count': s.flag_count,
      'Action Required': s.status,
      'Contact Status': s.contacts.some((c: any) => c.status === 'contacted')
        ? 'Contacted'
        : 'Pending',
    }))
    exportToCSV(exportData, `Flagged_Students_${new Date().toISOString().split('T')[0]}`)
  }

  const stats = {
    total: students.length,
    level1: students.filter((s) => s.flag_count === 1).length,
    level2: students.filter((s) => s.flag_count === 2).length,
    level3: students.filter((s) => s.flag_count >= 3).length,
  }

  const action = (
    <div className="flex items-center gap-3">
      <div className="w-[200px]">
        <Select value={termId} onValueChange={setTermId}>
          <SelectTrigger>
            <SelectValue placeholder="Select Term" />
          </SelectTrigger>
          <SelectContent>
            {terms.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={handleExport} disabled={!filteredStudents.length}>
        <Download className="mr-2 h-4 w-4" /> Export List
      </Button>
    </div>
  )

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Flagged Students"
        description="Monitor and manage interventions for at-risk students."
        action={action}
      />

      {/* Quick Stats */}
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Flagged" value={stats.total} icon={Flag} />
          <StatCard
            title="1 Flag (Message)"
            value={stats.level1}
            icon={MessageSquare}
            description="Parents need messaging"
          />
          <StatCard
            title="2 Flags (Call)"
            value={stats.level2}
            icon={Phone}
            description="Parents need calling"
          />
          <StatCard
            title="3+ Flags (Meeting)"
            value={stats.level3}
            icon={Users}
            description="Meeting required"
          />
        </div>
      </Section>

      {/* Filters and Table */}
      <Section title="Student List">
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Level:</span>
              <div className="flex gap-2 ml-2">
                {['all', '1', '2', '3'].map((level) => (
                  <Button
                    key={level}
                    variant={filterLevel === level ? 'default' : 'outline'}
                    size="sm"
                    className={cn('h-8 px-3', filterLevel === level ? 'bg-primary text-white' : '')}
                    onClick={() => setFilterLevel(level)}
                  >
                    {level === 'all' ? 'All' : `${level} Flag${level === '1' ? '' : 's'}`}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-gray-500">Fetching flagged students...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Student Name</TableHead>
                  <TableHead className="w-[250px]">Class / Course</TableHead>
                  <TableHead className="w-[100px] text-center">LP Count</TableHead>
                  <TableHead className="w-[100px] text-center">Flags</TableHead>
                  <TableHead className="w-[140px]">Action Required</TableHead>
                  <TableHead className="w-[140px]">Contact Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="bg-gray-100 p-4 rounded-full">
                          <Flag className="h-8 w-8 text-gray-400" />
                        </div>
                        <p>No flagged students found for this term.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const requiredType =
                      student.flag_count >= 3
                        ? 'meeting'
                        : student.flag_count === 2
                          ? 'call'
                          : 'message'
                    const contact = student.contacts.find(
                      (c: any) => c.contact_type === requiredType,
                    )

                    return (
                      <TableRow key={student.student_id} className="group hover:bg-gray-50/50">
                        <TableCell className="font-semibold text-gray-900">
                          {student.student_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700">
                              {student.class_name || 'Mathematics 11A'}
                            </span>
                            <span className="text-xs text-gray-500">{student.course_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-700 font-bold">
                            {student.low_points}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-0.5">
                            {Array.from({ length: student.flag_count }).map((_, i) => (
                              <Flag key={i} className="h-4 w-4 text-red-500 fill-current" />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="capitalize font-medium border-gray-200"
                          >
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {contact?.status === 'contacted' ? (
                            <Badge variant="success" className="gap-1.5">
                              <CheckCircle2 className="h-3 w-3" /> COMPLETED
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="gap-1.5">
                              <Clock className="h-3 w-3" /> PENDING
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 hover:bg-gray-100"
                              >
                                Update
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Intervention Action</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(student.student_id, requiredType, 'contacted')
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Mark as
                                Contacted
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(student.student_id, requiredType, 'pending')
                                }
                              >
                                <Clock className="mr-2 h-4 w-4 text-gray-500" /> Reset to Pending
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </Section>
    </PageContainer>
  )
}
