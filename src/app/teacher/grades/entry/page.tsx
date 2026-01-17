'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BatchEntry } from './components/batch-entry'
import { IndividualEntry } from './components/individual-entry'
import { Target, FileText, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'

type EntryMode = 'selection' | 'batch' | 'individual'

export default function GradeEntryPage() {
  const [mode, setMode] = useState<EntryMode>('selection')

  const action =
    mode !== 'selection' ? (
      <Button
        variant="outline"
        onClick={() => setMode('selection')}
        className="hover:bg-gray-50 border-gray-200"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Selection
      </Button>
    ) : undefined

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Grade Entry"
        description="Enter assessment marks for your students."
        action={action}
      />

      {mode === 'selection' ? (
        <Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              className="group hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg border-gray-200"
              onClick={() => setMode('batch')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Batch Entry</CardTitle>
                <CardDescription className="text-gray-500 mt-2">
                  Same topic and subtopic for multiple students in a class.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-gray-600 px-8 pb-8">
                Best for classwork, homework, or unit tests taken by the whole class.
              </CardContent>
            </Card>

            <Card
              className="group hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg border-gray-200"
              onClick={() => setMode('individual')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Individual Entry</CardTitle>
                <CardDescription className="text-gray-500 mt-2">
                  Different topics or assessments for each student.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-gray-600 px-8 pb-8">
                Best for individual projects, makeup tests, or differentiated assessments.
              </CardContent>
            </Card>
          </div>
        </Section>
      ) : mode === 'batch' ? (
        <Section>
          <BatchEntry />
        </Section>
      ) : (
        <Section>
          <IndividualEntry />
        </Section>
      )}
    </PageContainer>
  )
}
