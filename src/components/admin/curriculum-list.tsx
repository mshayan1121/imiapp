'use client'

import { useState } from 'react'
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
import { toast } from 'sonner'
import { AddCurriculumItemDialog } from './add-curriculum-item-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import { Loader2, Trash2, Plus } from 'lucide-react'

interface CurriculumListProps {
  items: any[]
  title: string
  parentId?: string
  onDelete: (id: string) => Promise<{ error?: string; success?: boolean }>
  onCreate: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  parentKey?: string
  level?: 'qualification' | 'board' | 'subject' | 'topic' | 'subtopic'
  qualifications?: any[]
  boards?: any[]
  subjects?: any[]
  topics?: any[]
}

export function CurriculumList({
  items,
  title,
  parentId,
  onDelete,
  onCreate,
  parentKey,
  level,
  qualifications,
  boards,
  subjects,
  topics,
}: CurriculumListProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    if (parentId && parentKey) {
      formData.append(parentKey, parentId)
    }

    const result = await onCreate(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${title} added successfully`)
      router.refresh()
      setOpen(false)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteId) return

    setIsDeleting(true)
    const result = await onDelete(deleteId)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${title} deleted successfully`)
      setDeleteId(null)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{title}s</h3>

        {level ? (
          <>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add {title}
            </Button>
            <AddCurriculumItemDialog
              open={open}
              onOpenChange={setOpen}
              level={level}
              qualifications={qualifications || []}
              boards={boards || []}
              subjects={subjects || []}
              topics={topics || []}
              onCreate={onCreate}
            />
          </>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!!parentKey && !parentId}>
                <Plus className="mr-2 h-4 w-4" />
                Add {title}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add {title}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="name" placeholder={`${title} Name`} required />
                <DialogFooter>
                  <Button type="submit" loading={loading}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                  {!parentId && parentKey
                    ? `Select a parent to view ${title.toLowerCase()}s`
                    : `No ${title.toLowerCase()}s found`}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(item.id)}
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
              This action cannot be undone. This will permanently delete the {title.toLowerCase()}{' '}
              and all its child records (e.g. if deleting a subject, all topics and subtopics will
              be removed).
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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
