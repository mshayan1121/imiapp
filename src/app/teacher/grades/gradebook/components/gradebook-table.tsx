'use client'

import { useState, useMemo, useCallback } from 'react'
import { InlineGradeRow } from './inline-grade-row'
import { TrendModal } from './trend-modal'
import { RetakeModal } from './retake-modal'
import { ReassignModal } from './reassign-modal'
import type { GradebookRow, GradeEntry } from '../types'

interface GradebookTableProps {
  rows: GradebookRow[]
  studentId: string
  studentName: string
  classId: string
  courseId: string
  termId: string
  onDataChange: () => void
}

interface ModalState {
  type: 'trend' | 'retake' | 'reassign' | null
  row: GradebookRow | null
}

export function GradebookTable({
  rows,
  studentId,
  studentName,
  classId,
  courseId,
  termId,
  onDataChange,
}: GradebookTableProps) {
  // Track which topics are expanded
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [modalState, setModalState] = useState<ModalState>({ type: null, row: null })

  // Initialize all topics as expanded
  useState(() => {
    const topicIds = rows.filter((r) => r.rowType === 'topic').map((r) => r.topicId)
    setExpandedTopics(new Set(topicIds))
  })

  // Toggle expand/collapse for a topic
  const toggleExpand = useCallback((topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(topicId)) {
        next.delete(topicId)
      } else {
        next.add(topicId)
      }
      return next
    })
  }, [])

  // Filter rows based on expansion state
  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (row.rowType === 'topic') return true
      // For subtopics, only show if parent topic is expanded
      return expandedTopics.has(row.parentTopicId || row.topicId)
    })
  }, [rows, expandedTopics])

  // Modal handlers
  const openTrendModal = useCallback((row: GradebookRow) => {
    setModalState({ type: 'trend', row })
  }, [])

  const openRetakeModal = useCallback((row: GradebookRow) => {
    setModalState({ type: 'retake', row })
  }, [])

  const openReassignModal = useCallback((row: GradebookRow) => {
    setModalState({ type: 'reassign', row })
  }, [])

  const closeModal = useCallback(() => {
    setModalState({ type: null, row: null })
  }, [])

  const handleModalSuccess = useCallback(() => {
    onDataChange()
    closeModal()
  }, [onDataChange, closeModal])

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No topics found for this course.</p>
        <p className="text-sm mt-1">Please check that the course has curriculum content.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="text-left py-3 px-3 font-semibold text-sm text-gray-600 border-b min-w-[200px]">
                Topic / Subtopic
              </th>
              <th className="text-left py-3 px-2 font-semibold text-sm text-gray-600 border-b w-[110px]">
                Work Type
              </th>
              <th className="text-left py-3 px-2 font-semibold text-sm text-gray-600 border-b w-[100px]">
                Subtype
              </th>
              <th className="text-center py-3 px-2 font-semibold text-sm text-gray-600 border-b w-[70px]">
                Marks
              </th>
              <th className="text-center py-3 px-2 font-semibold text-sm text-gray-600 border-b w-[70px]">
                Total
              </th>
              <th className="text-left py-3 px-2 font-semibold text-sm text-gray-600 border-b w-[140px]">
                Date
              </th>
              <th className="text-center py-3 px-2 font-semibold text-sm text-gray-600 border-b w-[70px]">
                %
              </th>
              <th className="text-left py-3 px-2 font-semibold text-sm text-gray-600 border-b w-[130px]">
                Status
              </th>
              <th className="text-left py-3 px-2 font-semibold text-sm text-gray-600 border-b w-[160px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <InlineGradeRow
                key={row.id}
                row={row}
                studentId={studentId}
                classId={classId}
                courseId={courseId}
                termId={termId}
                isExpanded={expandedTopics.has(row.topicId)}
                onToggleExpand={() => toggleExpand(row.topicId)}
                onOpenTrend={() => openTrendModal(row)}
                onReassignHomework={() => openReassignModal(row)}
                onAddRetake={() => openRetakeModal(row)}
                onDataChange={onDataChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Trend Modal */}
      {modalState.type === 'trend' && modalState.row && (
        <TrendModal
          open={true}
          onOpenChange={closeModal}
          topicName={modalState.row.name}
          rowType={modalState.row.rowType}
          grades={modalState.row.allGrades}
          studentName={studentName}
        />
      )}

      {/* Retake Modal */}
      {modalState.type === 'retake' && modalState.row && modalState.row.grade && (
        <RetakeModal
          open={true}
          onOpenChange={closeModal}
          topicName={modalState.row.name}
          rowType={modalState.row.rowType}
          topicId={modalState.row.topicId}
          subtopicId={modalState.row.subtopicId}
          originalGrade={modalState.row.grade}
          studentId={studentId}
          studentName={studentName}
          classId={classId}
          courseId={courseId}
          termId={termId}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Reassign Modal */}
      {modalState.type === 'reassign' && modalState.row && modalState.row.grade && (
        <ReassignModal
          open={true}
          onOpenChange={closeModal}
          topicName={modalState.row.name}
          rowType={modalState.row.rowType}
          originalGrade={modalState.row.grade}
          studentName={studentName}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  )
}
