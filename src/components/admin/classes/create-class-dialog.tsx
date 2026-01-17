'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, ArrowLeft, ArrowRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClass } from '@/app/admin/classes/actions'
import { useRouter } from 'next/navigation'

interface CreateClassDialogProps {
  teachers: any[]
  students: any[]
  courses: any[]
}

export function CreateClassDialog({ teachers, students, courses }: CreateClassDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Step 1: Class Info
  const [name, setName] = useState('')
  const [teacherId, setTeacherId] = useState('')

  // Step 2: Course Assignment Mode
  const [assignmentMode, setAssignmentMode] = useState<'same' | 'individual'>('same')

  // Step 3a: Same Course
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  // Step 3b: Individual Courses
  const [individualAssignments, setIndividualAssignments] = useState<
    { studentId: string; courseId: string }[]
  >([])

  const resetForm = () => {
    setName('')
    setTeacherId('')
    setAssignmentMode('same')
    setSelectedCourseId('')
    setSelectedStudentIds([])
    setIndividualAssignments([])
    setStep(1)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) resetForm()
  }

  const handleNext = () => {
    if (step === 1) {
      if (!name || !teacherId) {
        toast.error('Please fill in all required fields')
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleBack = () => {
    setStep((prev) => prev - 1)
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const addIndividualAssignment = () => {
    setIndividualAssignments([...individualAssignments, { studentId: '', courseId: '' }])
  }

  const updateIndividualAssignment = (
    index: number,
    field: 'studentId' | 'courseId',
    value: string,
  ) => {
    const newAssignments = [...individualAssignments]
    newAssignments[index] = { ...newAssignments[index], [field]: value }
    setIndividualAssignments(newAssignments)
  }

  const removeIndividualAssignment = (index: number) => {
    const newAssignments = [...individualAssignments]
    newAssignments.splice(index, 1)
    setIndividualAssignments(newAssignments)
  }

  const handleSubmit = async () => {
    let studentsData: { studentId: string; courseId: string }[] = []

    if (assignmentMode === 'same') {
      if (selectedStudentIds.length === 0) {
        if (!confirm('Create class without students?')) return
      } else if (!selectedCourseId) {
        toast.error('Please select a course')
        return
      }
      studentsData = selectedStudentIds.map((studentId) => ({
        studentId,
        courseId: selectedCourseId,
      }))
    } else {
      if (individualAssignments.length === 0) {
        if (!confirm('Create class without students?')) return
      }
      // Validate assignments
      for (const assignment of individualAssignments) {
        if (!assignment.studentId || !assignment.courseId) {
          toast.error('Please complete all student assignments')
          return
        }
      }
      studentsData = individualAssignments
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('name', name)
    formData.append('teacherId', teacherId)
    formData.append('students', JSON.stringify(studentsData))

    const result = await createClass(formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Class created successfully')
      handleOpenChange(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Year 10 Mathematics - Group A"
              />
            </div>
            <div className="space-y-2">
              <Label>Assign Teacher</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name || teacher.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <Label>Course Assignment Mode</Label>
            <RadioGroup
              value={assignmentMode}
              onValueChange={(v: 'same' | 'individual') => setAssignmentMode(v)}
            >
              <div
                className="flex items-center space-x-2 border p-4 rounded-md cursor-pointer hover:bg-accent"
                onClick={() => setAssignmentMode('same')}
              >
                <RadioGroupItem value="same" id="same" />
                <Label htmlFor="same" className="cursor-pointer">
                  Same course for all students
                </Label>
              </div>
              <div
                className="flex items-center space-x-2 border p-4 rounded-md cursor-pointer hover:bg-accent"
                onClick={() => setAssignmentMode('individual')}
              >
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="cursor-pointer">
                  Individual courses per student
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {step === 3 && assignmentMode === 'same' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Select Course</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Students ({selectedStudentIds.length} selected)</Label>
              <div className="border rounded-md max-h-[300px] overflow-y-auto p-2 space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md"
                  >
                    <Checkbox
                      id={student.id}
                      checked={selectedStudentIds.includes(student.id)}
                      onCheckedChange={() => handleStudentToggle(student.id)}
                    />
                    <Label htmlFor={student.id} className="cursor-pointer font-medium flex-1">
                      {student.name}{' '}
                      <span className="text-muted-foreground text-xs">
                        ({student.year_group} - {student.school})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {selectedCourseId && selectedStudentIds.length > 0 && (
              <div className="bg-muted p-4 rounded-md text-sm">
                Assigning <strong>{courses.find((c) => c.id === selectedCourseId)?.name}</strong> to{' '}
                {selectedStudentIds.length} students.
              </div>
            )}
          </div>
        )}

        {step === 3 && assignmentMode === 'individual' && (
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              {individualAssignments.map((assignment, index) => (
                <div key={index} className="flex gap-2 items-start border p-3 rounded-md">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={assignment.studentId}
                      onValueChange={(val) => updateIndividualAssignment(index, 'studentId', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem
                            key={s.id}
                            value={s.id}
                            disabled={individualAssignments.some(
                              (a, i) => i !== index && a.studentId === s.id,
                            )}
                          >
                            {s.name} ({s.year_group})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Select
                      value={assignment.courseId}
                      onValueChange={(val) => updateIndividualAssignment(index, 'courseId', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIndividualAssignment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" onClick={addIndividualAssignment} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Another Student
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              Create Class
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
