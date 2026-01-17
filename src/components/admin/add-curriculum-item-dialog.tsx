'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from 'sonner'

interface AddCurriculumItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  level: 'qualification' | 'board' | 'subject' | 'topic' | 'subtopic'
  qualifications: any[]
  boards: any[]
  subjects: any[]
  topics: any[]
  onCreate: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

export function AddCurriculumItemDialog({
  open,
  onOpenChange,
  level,
  qualifications,
  boards,
  subjects,
  topics,
  onCreate,
}: AddCurriculumItemDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  // Selection states
  const [selectedQualificationId, setSelectedQualificationId] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setName('')
      setSelectedQualificationId('')
      setSelectedBoardId('')
      setSelectedSubjectId('')
      setSelectedTopicId('')
    }
  }, [open])

  // Cascading logic: Filter options based on parent selection
  const filteredBoards = boards.filter((b) => b.qualification_id === selectedQualificationId)
  const filteredSubjects = subjects.filter((s) => s.board_id === selectedBoardId)
  const filteredTopics = topics.filter((t) => t.subject_id === selectedSubjectId)

  // Handlers to clear children when parent changes
  const handleQualificationChange = (value: string) => {
    setSelectedQualificationId(value)
    setSelectedBoardId('')
    setSelectedSubjectId('')
    setSelectedTopicId('')
  }

  const handleBoardChange = (value: string) => {
    setSelectedBoardId(value)
    setSelectedSubjectId('')
    setSelectedTopicId('')
  }

  const handleSubjectChange = (value: string) => {
    setSelectedSubjectId(value)
    setSelectedTopicId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', name)

      if (level !== 'qualification') {
        if (!selectedQualificationId) {
          toast.error('Please select a qualification')
          setLoading(false)
          return
        }
        // Although createBoard only needs qualificationId, we ensure the flow is correct
        if (level === 'board') {
          formData.append('qualificationId', selectedQualificationId)
        }
      }

      if (level === 'subject' || level === 'topic' || level === 'subtopic') {
        if (!selectedBoardId) {
          toast.error('Please select a board')
          setLoading(false)
          return
        }
        if (level === 'subject') {
          formData.append('boardId', selectedBoardId)
        }
      }

      if (level === 'topic' || level === 'subtopic') {
        if (!selectedSubjectId) {
          toast.error('Please select a subject')
          setLoading(false)
          return
        }
        if (level === 'topic') {
          formData.append('subjectId', selectedSubjectId)
        }
      }

      if (level === 'subtopic') {
        if (!selectedTopicId) {
          toast.error('Please select a topic')
          setLoading(false)
          return
        }
        formData.append('topicId', selectedTopicId)
      }

      const result = await onCreate(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${level.charAt(0).toUpperCase() + level.slice(1)} created successfully`)
        router.refresh()
        onOpenChange(false)
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New {getTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Qualification Selection */}
          {level !== 'qualification' && (
            <div className="space-y-2">
              <Label>Qualification</Label>
              <Select
                value={selectedQualificationId}
                onValueChange={handleQualificationChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Qualification" />
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
          )}

          {/* Board Selection */}
          {(level === 'subject' || level === 'topic' || level === 'subtopic') && (
            <div className="space-y-2">
              <Label>Board</Label>
              <Select
                value={selectedBoardId}
                onValueChange={handleBoardChange}
                disabled={!selectedQualificationId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Board" />
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
          )}

          {/* Subject Selection */}
          {(level === 'topic' || level === 'subtopic') && (
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={handleSubjectChange}
                disabled={!selectedBoardId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
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
          )}

          {/* Topic Selection */}
          {level === 'subtopic' && (
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select
                value={selectedTopicId}
                onValueChange={setSelectedTopicId}
                disabled={!selectedSubjectId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Topic" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTopics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-2">
            <Label>{getTitle()} Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${getTitle()} Name`}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Add {getTitle()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
