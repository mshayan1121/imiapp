'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import {
  ChevronDown,
  ChevronRight,
  BarChart2,
  RotateCcw,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { saveGrade, updateGrade } from '../actions'
import { LowPointBadge } from '../../entry/components/lp-badge'
import type { GradebookRow, SaveGradeInput } from '../types'

interface InlineGradeRowProps {
  row: GradebookRow
  studentId: string
  classId: string
  courseId: string
  termId: string
  isExpanded: boolean
  onToggleExpand: () => void
  onOpenTrend: () => void
  onReassignHomework: () => void
  onAddRetake: () => void
  onDataChange: () => void
}

export function InlineGradeRow({
  row,
  studentId,
  classId,
  courseId,
  termId,
  isExpanded,
  onToggleExpand,
  onOpenTrend,
  onReassignHomework,
  onAddRetake,
  onDataChange,
}: InlineGradeRowProps) {
  const grade = row.grade

  // Local state for inline editing
  const [marks, setMarks] = useState<string>(grade?.marksObtained?.toString() || '')
  const [total, setTotal] = useState<string>(grade?.totalMarks?.toString() || '')
  const [workType, setWorkType] = useState<'classwork' | 'homework' | ''>(
    grade?.workType || ''
  )
  const [workSubtype, setWorkSubtype] = useState<'worksheet' | 'pastpaper' | ''>(
    grade?.workSubtype || ''
  )
  const [assessedDate, setAssessedDate] = useState<Date | undefined>(
    grade?.assessedDate ? new Date(grade.assessedDate) : undefined
  )
  const [homeworkSubmitted, setHomeworkSubmitted] = useState<boolean>(
    grade?.homeworkSubmitted ?? false
  )
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const marksRef = useRef<HTMLInputElement>(null)
  const totalRef = useRef<HTMLInputElement>(null)

  // Update local state when grade changes from parent
  useEffect(() => {
    setMarks(grade?.marksObtained?.toString() || '')
    setTotal(grade?.totalMarks?.toString() || '')
    setWorkType(grade?.workType || '')
    setWorkSubtype(grade?.workSubtype || '')
    setAssessedDate(grade?.assessedDate ? new Date(grade.assessedDate) : undefined)
    setHomeworkSubmitted(grade?.homeworkSubmitted ?? false)
    setHasChanges(false)
  }, [grade])

  // Calculate percentage
  const percentage =
    total && marks && parseInt(total) > 0 ? Math.round((parseInt(marks) / parseInt(total)) * 100) : null

  const isLowPoint = percentage !== null && percentage < 80
  const canReassign = workType === 'homework' && percentage !== null && percentage < 80
  const canRetake = percentage !== null && percentage < 80

  const trend = useMemo(() => {
    if (row.allGrades.length < 2) return null
    const latest = row.allGrades[0]?.percentage
    const previous = row.allGrades[1]?.percentage
    if (latest === undefined || previous === undefined) return null
    if (latest > previous) return 'up'
    if (latest < previous) return 'down'
    return 'same'
  }, [row.allGrades])

  // Get percentage color
  const getPercentageColor = () => {
    if (percentage === null) return 'text-gray-400'
    if (percentage >= 80) return 'text-green-600 bg-green-50'
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  // Handle save
  const handleSave = useCallback(async () => {
    if (!marks || !total || parseInt(total) <= 0) {
      return
    }

    if (!workType || !workSubtype || !assessedDate) {
      toast.error('Please fill in all required fields (Work Type, Subtype, and Date)')
      return
    }

    setIsSaving(true)
    try {
      if (grade) {
        // Update existing grade
        const result = await updateGrade(grade.id, {
          marksObtained: parseInt(marks),
          totalMarks: parseInt(total),
          workType: workType as 'classwork' | 'homework',
          workSubtype: workSubtype as 'worksheet' | 'pastpaper',
          assessedDate: format(assessedDate, 'yyyy-MM-dd'),
          homeworkSubmitted: workType === 'homework' ? homeworkSubmitted : undefined,
        })

        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Grade updated')
          setHasChanges(false)
          onDataChange()
        }
      } else {
        // Create new grade
        const input: SaveGradeInput = {
          studentId,
          classId,
          courseId,
          termId,
          topicId: row.topicId,
          subtopicId: row.subtopicId,
          marksObtained: parseInt(marks),
          totalMarks: parseInt(total),
          workType: workType as 'classwork' | 'homework',
          workSubtype: workSubtype as 'worksheet' | 'pastpaper',
          assessedDate: format(assessedDate, 'yyyy-MM-dd'),
          homeworkSubmitted: workType === 'homework' ? homeworkSubmitted : undefined,
        }

        const result = await saveGrade(input)

        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Grade saved')
          setHasChanges(false)
          onDataChange()
        }
      }
    } finally {
      setIsSaving(false)
    }
  }, [
    marks,
    total,
    workType,
    workSubtype,
    assessedDate,
    homeworkSubmitted,
    grade,
    studentId,
    classId,
    courseId,
    termId,
    row,
    onDataChange,
  ])

  // Handle field changes
  const handleMarksChange = (value: string) => {
    // Validate marks don't exceed total
    if (value !== '' && total !== '' && parseFloat(value) > parseFloat(total)) {
      toast.error('Marks cannot exceed total')
      return
    }
    setMarks(value)
    setHasChanges(true)
  }

  const handleTotalChange = (value: string) => {
    setTotal(value)
    setHasChanges(true)
  }

  const handleWorkTypeChange = (value: string) => {
    setWorkType(value as 'classwork' | 'homework' | '')
    setHasChanges(true)
  }

  const handleWorkSubtypeChange = (value: string) => {
    setWorkSubtype(value as 'worksheet' | 'pastpaper' | '')
    setHasChanges(true)
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setAssessedDate(date)
      setHasChanges(true)
    }
  }

  const handleSubmittedChange = (checked: boolean) => {
    setHomeworkSubmitted(checked)
    setHasChanges(true)
  }

  // Handle blur - auto save
  const handleBlur = () => {
    if (hasChanges && marks && total) {
      handleSave()
    }
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hasChanges) {
      handleSave()
    }
    if (e.key === 'Tab' && !e.shiftKey && e.currentTarget === totalRef.current) {
      // Moving to next row, save if needed
      if (hasChanges && marks && total) {
        handleSave()
      }
    }
  }

  const isSubtopic = row.rowType === 'subtopic'

  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-gray-50/50',
        row.rowType === 'topic' && 'bg-gray-50/80 font-medium',
        grade?.isRetake && 'bg-blue-50/30',
        grade?.isReassigned && 'bg-orange-50/30'
      )}
    >
      {/* Topic/Subtopic Name */}
      <td className="py-2 px-3 sticky left-0 bg-inherit z-10">
        <div className={cn('flex items-center gap-2', isSubtopic && 'pl-6')}>
          {row.hasChildren && (
            <button onClick={onToggleExpand} className="p-0.5 hover:bg-gray-200 rounded">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {isSubtopic && <span className="text-gray-400">└</span>}
          <span className={cn(isSubtopic ? 'text-gray-600' : 'text-gray-900')}>{row.name}</span>
          {grade?.isRetake && (
            <Badge variant="secondary" className="text-xs">
              Retake
            </Badge>
          )}
          {grade?.isReassigned && (
            <Badge variant="secondary" className="text-xs bg-orange-100">
              Reassigned
            </Badge>
          )}
        </div>
      </td>

      {/* Work Type */}
      <td className="py-2 px-2">
        <Select value={workType || undefined} onValueChange={handleWorkTypeChange} disabled={isSaving}>
          <SelectTrigger className="h-8 w-[110px] text-xs bg-white text-gray-900 border-gray-200">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classwork">Classwork</SelectItem>
            <SelectItem value="homework">Homework</SelectItem>
          </SelectContent>
        </Select>
      </td>

      {/* Work Subtype */}
      <td className="py-2 px-2">
        <Select value={workSubtype || undefined} onValueChange={handleWorkSubtypeChange} disabled={isSaving}>
          <SelectTrigger className="h-8 w-[100px] text-xs bg-white text-gray-900 border-gray-200">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="worksheet">Worksheet</SelectItem>
            <SelectItem value="pastpaper">Past Paper</SelectItem>
          </SelectContent>
        </Select>
      </td>

      {/* Marks */}
      <td className="py-2 px-2">
        <Input
          ref={marksRef}
          type="number"
          value={marks}
          onChange={(e) => handleMarksChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className={cn(
            'h-8 w-16 text-center text-sm bg-white text-gray-900 border-gray-200',
            marks !== '' && percentage !== null && percentage < 80 && 'border-destructive'
          )}
          disabled={isSaving}
          min={0}
        />
      </td>

      {/* Total */}
      <td className="py-2 px-2">
        <Input
          ref={totalRef}
          type="number"
          value={total}
          onChange={(e) => handleTotalChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={total ? undefined : "—"}
          className="h-8 w-16 text-center text-sm bg-white text-gray-900 border-gray-200"
          disabled={isSaving}
          min={1}
        />
      </td>

      {/* Date */}
      <td className="py-2 px-2">
        <DatePicker date={assessedDate} setDate={handleDateChange} placeholder="Select date" />
      </td>

      {/* Percentage */}
      <td className="py-2 px-2 text-center">
        <span
          className={cn(
            'inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded text-sm font-medium min-w-[50px]',
            getPercentageColor()
          )}
        >
          {percentage !== null ? `${percentage}%` : '-'}
          {percentage !== null && trend === 'up' && (
            <span title="Improved from last attempt">
              <TrendingUp className="h-3 w-3 text-green-600" />
            </span>
          )}
          {percentage !== null && trend === 'down' && (
            <span title="Lower than last attempt">
              <TrendingDown className="h-3 w-3 text-red-600" />
            </span>
          )}
          {percentage !== null && trend === 'same' && (
            <span title="Same as last attempt">
              <Minus className="h-3 w-3 text-gray-500" />
            </span>
          )}
        </span>
      </td>

      {/* Status - Using LowPointBadge for consistency */}
      <td className="py-2 px-2">
        {workType === 'homework' ? (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={homeworkSubmitted}
              onCheckedChange={handleSubmittedChange}
              disabled={isSaving}
            />
            <span className="text-xs text-muted-foreground">
              {homeworkSubmitted ? 'Submitted' : 'Not submitted'}
            </span>
          </div>
        ) : percentage !== null ? (
          <LowPointBadge percentage={percentage} />
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-2 px-2">
        <div className="flex items-center gap-1">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

          {/* Trend button - always show if there are grades */}
          {row.allGrades.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onOpenTrend}
              title="View trend"
            >
              <BarChart2 className="h-4 w-4" />
            </Button>
          )}

          {/* Reassign HW - only for homework with low grade */}
          {canReassign && !grade?.isReassigned && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              onClick={onReassignHomework}
              title="Reassign homework"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reassign
            </Button>
          )}

          {/* Add Retake - for any low grade */}
          {canRetake && grade && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={onAddRetake}
              title="Add retake"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retake
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
