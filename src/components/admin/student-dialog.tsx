'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil } from 'lucide-react'
import { createStudent, updateStudent } from '@/app/admin/students/actions'
import { toast } from 'sonner'

const YEAR_GROUPS = ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13']

interface StudentDialogProps {
  student?: {
    id: string
    name: string
    year_group?: string
    school?: string
  }
  trigger?: React.ReactNode
}

export function StudentDialog({ student, trigger }: StudentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isEditing = !!student

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = isEditing
      ? await updateStudent(student.id, formData)
      : await createStudent(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(isEditing ? 'Student updated successfully' : 'Student created successfully')
      setOpen(false)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Student' : 'Add Student'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update student details.' : 'Add a new student to the system.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="name" className="sm:text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={student?.name}
                className="sm:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="yearGroup" className="sm:text-right">
                Year
              </Label>
              <Select name="yearGroup" defaultValue={student?.year_group} required>
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Select year group" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_GROUPS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="school" className="sm:text-right">
                School
              </Label>
              <Input
                id="school"
                name="school"
                defaultValue={student?.school}
                className="sm:col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="submit" loading={loading} className="w-full sm:w-auto min-h-[44px]">
              {isEditing ? 'Save Changes' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
