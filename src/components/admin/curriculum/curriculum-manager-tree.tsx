'use client'

import { useState } from 'react'
import { CurriculumTree } from './curriculum-tree'
import { CurriculumDialogs } from './curriculum-dialogs'
import { CourseCreationSection } from './course-creation-section'
import { CurriculumItem, CurriculumLevel } from './types'
import { BulkUploadCurriculumDialog } from './bulk-upload-curriculum-dialog'
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
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'

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
    <div className="w-full space-y-12 pb-20">
      {/* Curriculum Hierarchy Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Curriculum Hierarchy</h2>
            <p className="text-muted-foreground mt-1">
              Build and manage your curriculum structure from qualifications down to subtopics.
            </p>
          </div>
          <BulkUploadCurriculumDialog />
        </div>
        
        <CurriculumTree
          {...allData}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      </section>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-3 text-sm text-gray-400 font-medium">Course Management</span>
        </div>
      </div>

      {/* Course Creation Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Courses</h2>
          <p className="text-muted-foreground mt-1">
            Create and manage courses based on your curriculum. Each course automatically includes all topics and subtopics from its subject.
          </p>
        </div>

        <CourseCreationSection
          qualifications={qualifications}
          boards={boards}
          subjects={subjects}
          topics={topics}
          subtopics={subtopics}
          courses={courses}
        />
      </section>

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
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

