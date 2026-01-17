'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { Download, Loader2, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { getClassStudents, getCourseTopics } from '@/app/teacher/classes/actions'
import { format } from 'date-fns'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ClassDetailsDialogProps {
  classId: string | null
  className: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function StudentRow({ record }: { record: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleExpand = async () => {
    setIsOpen(!isOpen)
    if (!isOpen && topics.length === 0 && record.course?.subject?.id) {
      setLoading(true)
      try {
        const data = await getCourseTopics(record.course.subject.id)
        setTopics(data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <TableRow className={isOpen ? 'bg-muted/50' : ''}>
        <TableCell>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mr-2" onClick={handleExpand}>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <span className="font-medium">{record.student.name}</span>
        </TableCell>
        <TableCell>{record.student.year_group}</TableCell>
        <TableCell>{record.student.school}</TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit">
              {record.course?.name || 'No Course'}
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {format(new Date(record.enrolled_at), 'MMM d, yyyy')}
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow>
          <TableCell colSpan={5} className="p-0 bg-muted/50">
            <div className="p-4 pl-12 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm border-b pb-4">
                <div>
                  <span className="text-muted-foreground block text-xs uppercase">
                    Qualification
                  </span>
                  <span className="font-medium">{record.course?.qualification?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase">Board</span>
                  <span className="font-medium">{record.course?.board?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase">Subject</span>
                  <span className="font-medium">{record.course?.subject?.name || '-'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4" />
                  Curriculum Breakdown
                </h4>
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading topics...
                  </div>
                ) : topics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No topics found for this subject.</p>
                ) : (
                  <div className="space-y-3 pl-1">
                    {topics.map((topic) => (
                      <div key={topic.id} className="text-sm">
                        <div className="font-medium text-foreground">{topic.name}</div>
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <ul className="list-disc list-inside pl-2 mt-1 text-muted-foreground text-xs">
                            {topic.subtopics.map((sub: any) => (
                              <li key={sub.id}>{sub.name}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export function ClassDetailsDialog({
  classId,
  className,
  open,
  onOpenChange,
}: ClassDetailsDialogProps) {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && classId) {
      loadStudents()
    }
  }, [open, classId])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const data = await getClassStudents(classId!)
      setStudents(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // Simple CSV export
    const headers = [
      'Student Name',
      'Year Group',
      'School',
      'Course',
      'Qualification',
      'Board',
      'Subject',
    ]
    const rows = students.map((s) => [
      s.student.name,
      s.student.year_group,
      s.student.school,
      s.course?.name || '-',
      s.course?.qualification?.name || '-',
      s.course?.board?.name || '-',
      s.course?.subject?.name || '-',
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${className}-students.csv`
    a.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center pr-8">
            <DialogTitle>{className}</DialogTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={loading || students.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export List
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Enrolled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No students enrolled
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((record) => <StudentRow key={record.id} record={record} />)
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
