'use client'

import { useState } from 'react'
import { CurriculumTree } from './curriculum-tree'
import { CurriculumDialogs } from './curriculum-dialogs'
import { CurriculumItem, CurriculumLevel } from './types'
import { toast } from 'sonner'
import { 
  deleteQualification, 
  deleteBoard, 
  deleteSubject, 
  deleteTopic, 
  deleteSubtopic,
  createCourse
} from '@/app/admin/curriculum/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CurriculumManagerTreeProps {
  qualifications: any[]
  boards: any[]
  subjects: any[]
  topics: any[]
  subtopics: any[]
  courses: any[]
}

export function CurriculumManagerTree({
  qualifications,
  boards,
  subjects,
  topics,
  subtopics,
  courses,
}: CurriculumManagerTreeProps) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit'
    level: CurriculumLevel
    item?: CurriculumItem | null
    parentId?: string
  }>({
    isOpen: false,
    mode: 'add',
    level: 'qualification',
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<CurriculumItem | null>(null)

  const handleAdd = (level: CurriculumLevel, parentId?: string) => {
    setDialogState({
      isOpen: true,
      mode: 'add',
      level,
      parentId,
    })
  }

  const handleEdit = (item: CurriculumItem) => {
    setDialogState({
      isOpen: true,
      mode: 'edit',
      level: item.level,
      item,
    })
  }

  const handleAddCourse = async (subject: CurriculumItem) => {
    const board = boards.find(b => b.id === (subject as any).board_id)
    const qualification = qualifications.find(q => q.id === board?.qualification_id)
    
    const name = `${qualification?.name} ${board?.name} ${subject.name}`
    const formData = new FormData()
    formData.append('name', name)
    formData.append('qualificationId', qualification?.id || '')
    formData.append('boardId', board?.id || '')
    formData.append('subjectId', subject.id)

    try {
      const result = await createCourse(formData)
      if (result.success) {
        toast.success(`Course "${name}" created successfully`)
      } else {
        toast.error(result.error || 'Failed to create course')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  const handleDeleteRequest = (item: CurriculumItem) => {
    setItemToDelete(item)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    try {
      let result
      switch (itemToDelete.level) {
        case 'qualification': result = await deleteQualification(itemToDelete.id); break
        case 'board': result = await deleteBoard(itemToDelete.id); break
        case 'subject': result = await deleteSubject(itemToDelete.id); break
        case 'topic': result = await deleteTopic(itemToDelete.id); break
        case 'subtopic': result = await deleteSubtopic(itemToDelete.id); break
      }

      if (result?.success) {
        toast.success(`${itemToDelete.level.charAt(0).toUpperCase() + itemToDelete.level.slice(1)} deleted successfully`)
      } else {
        toast.error(result?.error || 'Failed to delete item')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  const allData = {
    qualifications,
    boards,
    subjects,
    topics,
    subtopics,
    courses,
  }

  return (
    <div className="w-full">
      <CurriculumTree
        {...allData}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onAddCourse={handleAddCourse}
      />

      <CurriculumDialogs
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        mode={dialogState.mode}
        level={dialogState.level}
        item={dialogState.item}
        parentId={dialogState.parentId}
        allData={allData}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {itemToDelete?.level} "{itemToDelete?.name}" and all its children items. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
