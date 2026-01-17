'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface CascadingSelectsProps {
  qualifications: any[]
  boards: any[]
  subjects: any[]
  topics: any[]
  level: 'qualification' | 'board' | 'subject' | 'topic' | 'subtopic'
  values: {
    qualificationId?: string
    boardId?: string
    subjectId?: string
    topicId?: string
  }
  onSelect: (ids: {
    qualificationId?: string
    boardId?: string
    subjectId?: string
    topicId?: string
  }) => void
}

export function CascadingSelects({
  qualifications,
  boards,
  subjects,
  topics,
  level,
  values,
  onSelect,
}: CascadingSelectsProps) {
  // Filter lists based on selection
  const filteredBoards = boards.filter((b) => b.qualification_id === values.qualificationId)
  const filteredSubjects = subjects.filter((s) => s.board_id === values.boardId)
  const filteredTopics = topics.filter((t) => t.subject_id === values.subjectId)

  const handleQualificationChange = (val: string) => {
    onSelect({ qualificationId: val })
  }

  const handleBoardChange = (val: string) => {
    onSelect({ qualificationId: values.qualificationId, boardId: val })
  }

  const handleSubjectChange = (val: string) => {
    onSelect({ qualificationId: values.qualificationId, boardId: values.boardId, subjectId: val })
  }

  const handleTopicChange = (val: string) => {
    onSelect({
      qualificationId: values.qualificationId,
      boardId: values.boardId,
      subjectId: values.subjectId,
      topicId: val,
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {level !== 'qualification' && (
        <div className="space-y-2">
          <Label>Qualification</Label>
          <Select value={values.qualificationId || ''} onValueChange={handleQualificationChange}>
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

      {level !== 'qualification' && level !== 'board' && (
        <div className="space-y-2">
          <Label>Board</Label>
          <Select
            value={values.boardId || ''}
            onValueChange={handleBoardChange}
            disabled={!values.qualificationId}
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

      {level !== 'qualification' && level !== 'board' && level !== 'subject' && (
        <div className="space-y-2">
          <Label>Subject</Label>
          <Select
            value={values.subjectId || ''}
            onValueChange={handleSubjectChange}
            disabled={!values.boardId}
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

      {level === 'subtopic' && (
        <div className="space-y-2">
          <Label>Topic</Label>
          <Select
            value={values.topicId || ''}
            onValueChange={handleTopicChange}
            disabled={!values.subjectId}
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
    </div>
  )
}
