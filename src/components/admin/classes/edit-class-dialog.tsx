'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getClassDetails, removeStudentFromClass } from '@/app/admin/classes/actions'
import { Loader2, Trash2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function EditClassDialog({ classId, open, onOpenChange }: any) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const loadData = () => {
    if (classId) {
      setLoading(true)
      getClassDetails(classId)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, classId])

  const handleRemoveStudent = async (id: string) => {
    if (!confirm('Remove this student from class?')) return
    const result = await removeStudentFromClass(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Student removed')
      loadData()
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Class Details</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid gap-4 p-4 border rounded-md bg-muted/20">
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Class Name</Label>
                <div className="font-medium text-lg">{data.name}</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  Enrolled Students ({data.students?.length || 0})
                </h3>
                <Button size="sm">Add Student</Button>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.students?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                          No students enrolled
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.students?.map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.student.name}</TableCell>
                          <TableCell>{s.student.year_group}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="w-fit">
                                {s.course?.name || 'No Course'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {s.course?.qualification?.name} • {s.course?.board?.name} •{' '}
                                {s.course?.subject?.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveStudent(s.id)}
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
            </div>
          </div>
        ) : (
          <div>Error loading class details</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
