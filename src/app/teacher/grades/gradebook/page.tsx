'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GradebookTable } from './components/gradebook-table'
import { BookOpen, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  getTeacherClasses,
  getClassStudents,
  getTerms,
  getActiveTerm,
  getGradebookData,
} from './actions'
import type { GradebookData, GradebookStudent } from './types'

type Step = 'select' | 'gradebook'

export default function GradebookPage() {
  const [step, setStep] = useState<Step>('select')
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([])
  const [activeTermId, setActiveTermId] = useState<string | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [students, setStudents] = useState<GradebookStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [gradebook, setGradebook] = useState<GradebookData | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        setInitialLoading(true)
        const [classesRes, termsRes, activeTerm] = await Promise.all([
          getTeacherClasses(),
          getTerms(),
          getActiveTerm(),
        ])
        setClasses(classesRes)
        setTerms(termsRes)
        if (activeTerm) {
          setActiveTermId(activeTerm.id)
          setSelectedTermId(activeTerm.id)
        } else if (termsRes.length > 0) {
          setSelectedTermId(termsRes[0].id)
        }
      } catch {
        toast.error('Failed to load classes and terms')
      } finally {
        setInitialLoading(false)
      }
    }
    fetch()
  }, [])

  const onClassSelect = useCallback(async (classId: string) => {
    setSelectedClassId(classId)
    try {
      setLoading(true)
      const list = await getClassStudents(classId)
      setStudents(list)
      setSelectedStudentId('')
      setGradebook(null)
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadGradebook = useCallback(async () => {
    if (!selectedClassId || !selectedStudentId || !selectedTermId) return
    try {
      setLoading(true)
      const data = await getGradebookData(
        selectedClassId,
        selectedStudentId,
        selectedTermId
      )
      setGradebook(data ?? null)
      if (data) setStep('gradebook')
      else toast.error('No gradebook data for this student in this term.')
    } catch {
      toast.error('Failed to load gradebook')
    } finally {
      setLoading(false)
    }
  }, [selectedClassId, selectedStudentId, selectedTermId])

  const onDataChange = useCallback(() => {
    if (!selectedClassId || !selectedStudentId || !selectedTermId) return
    getGradebookData(selectedClassId, selectedStudentId, selectedTermId).then(
      (data) => setGradebook(data ?? null)
    )
  }, [selectedClassId, selectedStudentId, selectedTermId])

  const backToSelect = useCallback(() => {
    setStep('select')
  }, [])

  const action =
    step === 'gradebook' ? (
      <Button
        variant="outline"
        onClick={backToSelect}
        className="hover:bg-gray-50 border-gray-200"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Selection
      </Button>
    ) : undefined

  if (initialLoading) {
    return (
      <PageContainer className="animate-in fade-in duration-500">
        <PageHeader
          title="Gradebook"
          description="View and manage student grades by topic."
        />
        <Section>
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-24 w-full max-w-md" />
          </div>
        </Section>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Gradebook"
        description="View and manage student grades by topic."
        action={action}
      />

      {step === 'select' ? (
        <Section>
          <Card className="border-gray-200 max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Select class and student</CardTitle>
                  <CardDescription>
                    Choose a class, student, and term to view their gradebook.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Class</label>
                <Select
                  value={selectedClassId}
                  onValueChange={onClassSelect}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClassId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Student</label>
                  <Select
                    value={selectedStudentId}
                    onValueChange={setSelectedStudentId}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedClassId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Term</label>
                  <Select
                    value={selectedTermId}
                    onValueChange={setSelectedTermId}
                    disabled={loading || terms.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                          {t.id === activeTermId ? ' (active)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={loadGradebook}
                disabled={
                  loading ||
                  !selectedClassId ||
                  !selectedStudentId ||
                  !selectedTermId
                }
                className="w-full sm:w-auto"
              >
                {loading ? 'Loading…' : 'Open gradebook'}
              </Button>
            </CardContent>
          </Card>
        </Section>
      ) : (
        <Section>
          {gradebook && (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">
                {gradebook.className} · {gradebook.courseName} · {gradebook.studentName}
              </p>
            </div>
          )}
          {gradebook ? (
            <GradebookTable
              rows={gradebook.rows}
              studentId={selectedStudentId}
              studentName={gradebook.studentName}
              classId={selectedClassId}
              courseId={gradebook.courseId}
              termId={selectedTermId}
              onDataChange={onDataChange}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No gradebook data to display.
            </div>
          )}
        </Section>
      )}
    </PageContainer>
  )
}
