'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Trash2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { createCourse, deleteCourse } from '@/app/admin/curriculum/actions'

interface CoursesListProps {
  courses: any[]
  qualifications: any[]
  boards: any[]
  subjects: any[]
}

export function CoursesList({ courses, qualifications, boards, subjects }: CoursesListProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state
  const [selectedQualificationId, setSelectedQualificationId] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [courseName, setCourseName] = useState('')

  // Derived state for filtering options
  const filteredBoards = boards.filter((b) => b.qualification_id === selectedQualificationId)
  const filteredSubjects = subjects.filter((s) => s.board_id === selectedBoardId)

  // Auto-generate course name
  useEffect(() => {
    if (selectedQualificationId && selectedBoardId && selectedSubjectId) {
      const qual = qualifications.find((q) => q.id === selectedQualificationId)?.name
      const board = boards.find((b) => b.id === selectedBoardId)?.name
      const subject = subjects.find((s) => s.id === selectedSubjectId)?.name
      if (qual && board && subject) {
        setCourseName(`${qual} ${subject} ${board}`)
      }
    }
  }, [
    selectedQualificationId,
    selectedBoardId,
    selectedSubjectId,
    qualifications,
    boards,
    subjects,
  ])

  // Filter courses for display
  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
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

              <DialogFooter>
                <Button type="submit" loading={loading}>
                  Create Course
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Name</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Board</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No courses found
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{course.qualification?.name}</TableCell>
                  <TableCell>{course.board?.name}</TableCell>
                  <TableCell>{course.subject?.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(course.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
