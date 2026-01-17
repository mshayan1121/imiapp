'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CurriculumList } from './curriculum-list'
import { CoursesList } from './courses-list'
import { CascadingSelects } from './cascading-selects'
import {
  createQualification,
  deleteQualification,
  createBoard,
  deleteBoard,
  createSubject,
  deleteSubject,
  createTopic,
  deleteTopic,
  createSubtopic,
  deleteSubtopic,
} from '@/app/admin/curriculum/actions'

interface CurriculumManagerProps {
  qualifications: any[]
  boards: any[]
  subjects: any[]
  topics: any[]
  subtopics: any[]
  courses: any[]
}

export function CurriculumManager({
  qualifications,
  boards,
  subjects,
  topics,
  subtopics,
  courses,
}: CurriculumManagerProps) {
  const [activeTab, setActiveTab] = useState('courses')
  const [selectedIds, setSelectedIds] = useState<{
    qualificationId?: string
    boardId?: string
    subjectId?: string
    topicId?: string
  }>({})

  const filteredBoards = boards.filter((b) => b.qualification_id === selectedIds.qualificationId)
  const filteredSubjects = subjects.filter((s) => s.board_id === selectedIds.boardId)
  const filteredTopics = topics.filter((t) => t.subject_id === selectedIds.subjectId)
  const filteredSubtopics = subtopics.filter((st) => st.topic_id === selectedIds.topicId)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="courses">Courses</TabsTrigger>
        <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
        <TabsTrigger value="boards">Boards</TabsTrigger>
        <TabsTrigger value="subjects">Subjects</TabsTrigger>
        <TabsTrigger value="topics">Topics</TabsTrigger>
        <TabsTrigger value="subtopics">Subtopics</TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="courses">
          <CoursesList
            courses={courses}
            qualifications={qualifications}
            boards={boards}
            subjects={subjects}
          />
        </TabsContent>

        <TabsContent value="qualifications">
          <CurriculumList
            items={qualifications}
            title="Qualification"
            onDelete={deleteQualification}
            onCreate={createQualification}
            level="qualification"
            qualifications={qualifications}
            boards={boards}
            subjects={subjects}
            topics={topics}
          />
        </TabsContent>

        <TabsContent value="boards">
          <CascadingSelects
            level="board"
            qualifications={qualifications}
            boards={[]}
            subjects={[]}
            topics={[]}
            values={selectedIds}
            onSelect={setSelectedIds}
          />
          <CurriculumList
            items={filteredBoards}
            title="Board"
            parentId={selectedIds.qualificationId}
            parentKey="qualificationId"
            onDelete={deleteBoard}
            onCreate={createBoard}
            level="board"
            qualifications={qualifications}
            boards={boards}
            subjects={subjects}
            topics={topics}
          />
        </TabsContent>

        <TabsContent value="subjects">
          <CascadingSelects
            level="subject"
            qualifications={qualifications}
            boards={boards}
            subjects={[]}
            topics={[]}
            values={selectedIds}
            onSelect={setSelectedIds}
          />
          <CurriculumList
            items={filteredSubjects}
            title="Subject"
            parentId={selectedIds.boardId}
            parentKey="boardId"
            onDelete={deleteSubject}
            onCreate={createSubject}
            level="subject"
            qualifications={qualifications}
            boards={boards}
            subjects={subjects}
            topics={topics}
          />
        </TabsContent>

        <TabsContent value="topics">
          <CascadingSelects
            level="topic"
            qualifications={qualifications}
            boards={boards}
            subjects={subjects}
            topics={[]}
            values={selectedIds}
            onSelect={setSelectedIds}
          />
          <CurriculumList
            items={filteredTopics}
            title="Topic"
            parentId={selectedIds.subjectId}
            parentKey="subjectId"
            onDelete={deleteTopic}
            onCreate={createTopic}
            level="topic"
            qualifications={qualifications}
            boards={boards}
            subjects={subjects}
            topics={topics}
          />
        </TabsContent>

        <TabsContent value="subtopics">
          <CascadingSelects
            level="subtopic"
            qualifications={qualifications}
            boards={boards}
            subjects={subjects}
            topics={topics}
            values={selectedIds}
            onSelect={setSelectedIds}
          />
          <CurriculumList
            items={filteredSubtopics}
            title="Subtopic"
            parentId={selectedIds.topicId}
            parentKey="topicId"
            onDelete={deleteSubtopic}
            onCreate={createSubtopic}
            level="subtopic"
            qualifications={qualifications}
            boards={boards}
            subjects={subjects}
            topics={topics}
          />
        </TabsContent>
      </div>
    </Tabs>
  )
}
