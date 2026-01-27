'use client'

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
import { Badge } from '@/components/ui/badge'
import { Search, MoreHorizontal, Trash2, Edit, Copy, RefreshCw } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useState, useMemo, useCallback, memo } from 'react'
import { deleteClass } from '@/app/admin/classes/actions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { EditClassDialog } from './edit-class-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { School } from 'lucide-react'

import { useRouter } from 'next/navigation'

interface ClassItem {
  id: string
  name: string
  created_at: string
  teacher_id: string
  teacher?: {
    full_name?: string
    email?: string
  }
  class_students: { count: number }[]
}

interface ClassesListProps {
  classes: ClassItem[]
}

export const ClassesList = memo(function ClassesList({ classes }: ClassesListProps) {
  const [search, setSearch] = useState('')
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const filteredClasses = useMemo(() => classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.teacher?.full_name || c.teacher?.email || '').toLowerCase().includes(search.toLowerCase()),
  ), [classes, search])

  const handleDelete = useCallback(async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const result = await deleteClass(deleteId)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Class deleted successfully')
      setDeleteId(null)
      router.refresh()
    }
  }, [deleteId, router])

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={School}
        title="No classes created yet"
        description="Get started by creating your first class and assigning a teacher."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center w-full max-w-sm relative group">
        <Search className="absolute left-3 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search classes or teachers..."
          className="pl-10 bg-white border-gray-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-[200px] font-semibold text-gray-700">Class Name</TableHead>
              <TableHead className="w-[200px] font-semibold text-gray-700">Teacher</TableHead>
              <TableHead className="w-[120px] font-semibold text-gray-700">Students</TableHead>
              <TableHead className="w-[140px] font-semibold text-gray-700">Created</TableHead>
              <TableHead className="w-[100px] text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12">
                  <EmptyState
                    title="No matches found"
                    description={`No classes match your search "${search}"`}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredClasses.map((cls) => (
                <TableRow
                  key={cls.id}
                  className="cursor-pointer hover:bg-gray-50/50 group transition-colors"
                  onClick={() => setSelectedClassId(cls.id)}
                >
                  <TableCell className="font-semibold text-gray-900">{cls.name}</TableCell>
                  <TableCell className="text-gray-600">
                    {cls.teacher?.full_name || cls.teacher?.email || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="info" className="font-medium">
                      {cls.class_students[0]?.count || 0} students
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {format(new Date(cls.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 w-10 p-0 hover:bg-gray-100 min-h-[44px] min-w-[44px]">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="cursor-pointer min-h-[44px]">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer min-h-[44px]">
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer min-h-[44px]"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteId(cls.id)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditClassDialog
        classId={selectedClassId}
        open={!!selectedClassId}
        onOpenChange={(open: boolean) => !open && setSelectedClassId(null)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the class and remove all
              student enrollments.
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
              {isDeleting ? 'Deleting...' : 'Delete Class'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})
