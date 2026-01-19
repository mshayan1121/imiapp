'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, BookOpen, ChevronRight, Search } from 'lucide-react'
import { toast } from 'sonner'
import { createCourse, deleteCourse } from '@/app/admin/curriculum/actions'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface CourseCreationSectionProps {
  qualifications: any[]
  boards: any[]
  subjects: any[]
  topics: any[]
  subtopics: any[]
  courses: any[]
}

export function CourseCreationSection({
  qualifications,
  boards,
  subjects,
  topics,
  subtopics,
  courses,
}: CourseCreationSectionProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [selectedQualificationId, setSelectedQualificationId] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [courseName, setCourseName] = useState('')

  // Derived state for filtering
  const filteredBoards = useMemo(
    () => boards.filter((b) => b.qualification_id === selectedQualificationId),
    [boards, selectedQualificationId]
  )

  const filteredSubjects = useMemo(
    () => subjects.filter((s) => s.board_id === selectedBoardId),
    [subjects, selectedBoardId]
  )

  // Get topics and subtopics for selected subject
  const availableTopics = useMemo(() => {
    if (!selectedSubjectId) return []
    return topics
      .filter((t) => t.subject_id === selectedSubjectId)
      .map((topic) => ({
        ...topic,
        subtopics: subtopics.filter((st) => st.topic_id === topic.id),
      }))
  }, [topics, subtopics, selectedSubjectId])

  // Auto-generate course name
  useEffect(() => {
    if (selectedQualificationId && selectedBoardId && selectedSubjectId) {
      const qual = qualifications.find((q) => q.id === selectedQualificationId)?.name
      const board = boards.find((b) => b.id === selectedBoardId)?.name
      const subject = subjects.find((s) => s.id === selectedSubjectId)?.name
      if (qual && board && subject) {
        setCourseName(`${qual} ${board} ${subject}`)
      }
    }
  }, [selectedQualificationId, selectedBoardId, selectedSubjectId, qualifications, boards, subjects])

  // Filter courses for display
  const filteredCourses = useMemo(
    () =>
      courses.filter((course) =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [courses, searchTerm]
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.append('name', courseName)
    formData.append('qualificationId', selectedQualificationId)
    formData.append('boardId', selectedBoardId)
    formData.append('subjectId', selectedSubjectId)

    const result = await createCourse(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Course created successfully')
      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteId) return

    setIsDeleting(true)
    const result = await deleteCourse(deleteId)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Course deleted successfully')
      setDeleteId(null)
      router.refresh()
    }
  }

  function resetForm() {
    setSelectedQualificationId('')
    setSelectedBoardId('')
    setSelectedSubjectId('')
    setCourseName('')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create New Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Select
                    value={selectedQualificationId}
                    onValueChange={(val) => {
                      setSelectedQualificationId(val)
                      setSelectedBoardId('')
                      setSelectedSubjectId('')
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select qualification" />
                    </SelectTrigger>
                    <SelectContent>
                      {qualifications.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Board</Label>
                  <Select
                    value={selectedBoardId}
                    onValueChange={(val) => {
                      setSelectedBoardId(val)
                      setSelectedSubjectId('')
                    }}
                    disabled={!selectedQualificationId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBoards.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select
                    value={selectedSubjectId}
                    onValueChange={setSelectedSubjectId}
                    disabled={!selectedBoardId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Course Name</Label>
                  <Input
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. GCSE Chemistry AQA"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated based on selection, but you can edit it.
                  </p>
                </div>
              </div>

              {/* Preview of Topics and Subtopics */}
              {selectedSubjectId && availableTopics.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-semibold">
                      Available Topics & Subtopics ({availableTopics.length} topics)
                    </Label>
                  </div>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 px-4">
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {availableTopics.map((topic) => (
                          <Collapsible key={topic.id}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full text-left p-2 hover:bg-muted rounded group">
                              <div className="flex items-center gap-2">
                                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                                <span className="text-sm font-medium">{topic.name}</span>
                                {topic.subtopics.length > 0 && (
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                    {topic.subtopics.length} subtopic{topic.subtopics.length !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-6 mt-1 space-y-1">
                                {topic.subtopics.length > 0 ? (
                                  topic.subtopics.map((subtopic: any) => (
                                    <div
                                      key={subtopic.id}
                                      className="text-xs text-muted-foreground pl-4 py-1"
                                    >
                                      • {subtopic.name}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-muted-foreground pl-4 py-1 italic">
                                    No subtopics
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t">
                        These topics and subtopics will be available when this course is assigned to classes.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedSubjectId && availableTopics.length === 0 && (
                <div className="pt-4 border-t">
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="pt-4">
                      <p className="text-sm text-yellow-800">
                        ⚠️ No topics found for this subject. Add topics in the curriculum hierarchy above before creating the course.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !selectedSubjectId} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? 'Creating...' : 'Create Course'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-0">
          <div className="rounded-md">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold">Course Name</TableHead>
                  <TableHead className="font-semibold">Qualification</TableHead>
                  <TableHead className="font-semibold">Board</TableHead>
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      {searchTerm ? 'No courses found matching your search' : 'No courses created yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => (
                    <TableRow key={course.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-blue-600">{course.name}</TableCell>
                      <TableCell>{course.qualification?.name || 'N/A'}</TableCell>
                      <TableCell>{course.board?.name || 'N/A'}</TableCell>
                      <TableCell>{course.subject?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(course.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course and all
              associated student enrollments and grades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
