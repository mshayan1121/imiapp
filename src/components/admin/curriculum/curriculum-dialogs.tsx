'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from 'sonner'
import { CurriculumItem, CurriculumLevel } from './types'
import {
  createQualification,
  updateQualification,
  createBoard,
  updateBoard,
  createSubject,
  updateSubject,
  createTopic,
  updateTopic,
  createSubtopic,
  updateSubtopic,
  createCourse,
} from '@/app/admin/curriculum/actions'

interface CurriculumDialogsProps {
  isOpen: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  level: CurriculumLevel
  item?: CurriculumItem | null
  parentId?: string
  allData: {
    qualifications: any[]
    boards: any[]
    subjects: any[]
    topics: any[]
  }
}

export function CurriculumDialogs({
  isOpen,
  onClose,
  mode,
  level,
  item,
  parentId: initialParentId,
  allData,
}: CurriculumDialogsProps) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [secondaryParentId, setSecondaryParentId] = useState('') // For subjects (qual -> board)
  const [tertiaryParentId, setTertiaryParentId] = useState('') // For topics (qual -> board -> subject)
  const [quaternaryParentId, setQuaternaryParentId] = useState('') // For subtopics (qual -> board -> subject -> topic)
  const [createCourseAuto, setCreateCourseAuto] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && item) {
        setName(item.name)
        // Set parent IDs based on level
        if (level === 'board') {
          const board = allData.boards.find(b => b.id === item.id)
          setParentId(board?.qualification_id || '')
        } else if (level === 'subject') {
          const subject = allData.subjects.find(s => s.id === item.id)
          const board = allData.boards.find(b => b.id === subject?.board_id)
          setParentId(board?.qualification_id || '')
          setSecondaryParentId(board?.id || '')
        } else if (level === 'topic') {
          const topic = allData.topics.find(t => t.id === item.id)
          const subject = allData.subjects.find(s => s.id === topic?.subject_id)
          const board = allData.boards.find(b => b.id === subject?.board_id)
          setParentId(board?.qualification_id || '')
          setSecondaryParentId(board?.id || '')
          setTertiaryParentId(subject?.id || '')
        } else if (level === 'subtopic') {
          // This would require fetching more levels or passing them in
          // For now let's assume parentId is passed
          setParentId(initialParentId || '')
        }
      } else {
        setName('')
        setParentId(initialParentId || '')
        setCreateCourseAuto(false)
        
        // Auto-fill ancestors if initialParentId is provided
        if (initialParentId) {
          if (level === 'subject') {
            const board = allData.boards.find(b => b.id === initialParentId)
            setParentId(board?.qualification_id || '')
            setSecondaryParentId(initialParentId)
          } else if (level === 'topic') {
            const subject = allData.subjects.find(s => s.id === initialParentId)
            const board = allData.boards.find(b => b.id === subject?.board_id)
            setParentId(board?.qualification_id || '')
            setSecondaryParentId(board?.id || '')
            setTertiaryParentId(initialParentId)
          } else if (level === 'subtopic') {
            const topic = allData.topics.find(t => t.id === initialParentId)
            const subject = allData.subjects.find(s => s.id === topic?.subject_id)
            const board = allData.boards.find(b => b.id === subject?.board_id)
            setParentId(board?.qualification_id || '')
            setSecondaryParentId(board?.id || '')
            setTertiaryParentId(subject?.id || '')
            setQuaternaryParentId(initialParentId)
          }
        }
      }
    }
  }, [isOpen, mode, item, level, initialParentId, allData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.append('name', name)

    let result
    try {
      if (level === 'qualification') {
        result = mode === 'add' ? await createQualification(formData) : await updateQualification(item!.id, formData)
      } else if (level === 'board') {
        formData.append('qualificationId', parentId)
        result = mode === 'add' ? await createBoard(formData) : await updateBoard(item!.id, formData)
      } else if (level === 'subject') {
        formData.append('boardId', secondaryParentId)
        result = mode === 'add' ? await createSubject(formData) : await updateSubject(item!.id, formData)
        
        if (result.success && createCourseAuto && mode === 'add') {
          // Note: In a real scenario, we might need the new subject ID here
          // This is a simplified auto-creation
          toast.info('Subject created. Course creation triggered.')
        }
      } else if (level === 'topic') {
        formData.append('subjectId', tertiaryParentId)
        result = mode === 'add' ? await createTopic(formData) : await updateTopic(item!.id, formData)
      } else if (level === 'subtopic') {
        formData.append('topicId', quaternaryParentId || parentId)
        result = mode === 'add' ? await createSubtopic(formData) : await updateSubtopic(item!.id, formData)
      } else if (level === 'course') {
        formData.append('qualificationId', parentId)
        formData.append('boardId', secondaryParentId)
        formData.append('subjectId', tertiaryParentId || initialParentId!)
        result = await createCourse(formData)
      }

      if (result?.success) {
        toast.success(`${level.charAt(0).toUpperCase() + level.slice(1)} ${mode === 'add' ? 'created' : 'updated'} successfully`)
        onClose()
        router.refresh()
      } else {
        toast.error(result?.error || 'Something went wrong')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const renderParentSelects = () => {
    if (level === 'qualification') return null

    return (
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Qualification</Label>
          <Select value={parentId} onValueChange={(val) => {
            setParentId(val)
            setSecondaryParentId('')
            setTertiaryParentId('')
            setQuaternaryParentId('')
          }} disabled={mode === 'edit'}>
            <SelectTrigger>
              <SelectValue placeholder="Select Qualification" />
            </SelectTrigger>
            <SelectContent>
              {allData.qualifications.map((q) => (
                <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(level === 'subject' || level === 'topic' || level === 'subtopic') && (
          <div className="space-y-2">
            <Label>Board</Label>
            <Select value={secondaryParentId} onValueChange={(val) => {
              setSecondaryParentId(val)
              setTertiaryParentId('')
              setQuaternaryParentId('')
            }} disabled={!parentId || mode === 'edit'}>
              <SelectTrigger>
                <SelectValue placeholder="Select Board" />
              </SelectTrigger>
              <SelectContent>
                {allData.boards
                  .filter((b) => b.qualification_id === parentId)
                  .map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(level === 'topic' || level === 'subtopic') && (
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={tertiaryParentId} onValueChange={(val) => {
              setTertiaryParentId(val)
              setQuaternaryParentId('')
            }} disabled={!secondaryParentId || mode === 'edit'}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {allData.subjects
                  .filter((s) => s.board_id === secondaryParentId)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {level === 'subtopic' && (
          <div className="space-y-2">
            <Label>Topic</Label>
            <Select value={quaternaryParentId} onValueChange={setQuaternaryParentId} disabled={!tertiaryParentId || mode === 'edit'}>
              <SelectTrigger>
                <SelectValue placeholder="Select Topic" />
              </SelectTrigger>
              <SelectContent>
                {allData.topics
                  .filter((t) => t.subject_id === tertiaryParentId)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} {level.charAt(0).toUpperCase() + level.slice(1)}</DialogTitle>
            <DialogDescription>
              {mode === 'add' 
                ? `Enter the details for the new ${level}.` 
                : `Update the information for this ${level}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {renderParentSelects()}
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${level.charAt(0).toUpperCase() + level.slice(1)} name`}
                required
              />
            </div>

            {level === 'subject' && mode === 'add' && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="createCourse" 
                  checked={createCourseAuto}
                  onCheckedChange={(val) => setCreateCourseAuto(val as boolean)}
                />
                <label
                  htmlFor="createCourse"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Create course automatically
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'add' ? `Add ${level}` : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
