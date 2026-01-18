import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { ClassesList } from '@/components/admin/classes/classes-list'
import { CreateClassDialog } from '@/components/admin/classes/create-class-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'

async function ClassesContentLoader() {
  const supabase = await createClient()

  // Parallel data fetching
  const [
    { data: classesData, error: classesError },
    { data: profiles },
    { data: students },
    { data: coursesData },
  ] = await Promise.all([
    supabase
      .from('classes')
      .select('*, class_students(count)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*'),
    supabase.from('students').select('*').order('name'),
    supabase
      .from('courses')
      .select('*, qualification:qualifications(name), board:boards(name), subject:subjects(name)')
      .order('name'),
  ])

  if (classesError) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        Error loading classes: {classesError.message}
      </div>
    )
  }

  const courses = (coursesData || []).map((c: any) => ({
    ...c,
    qualification: Array.isArray(c.qualification) ? c.qualification[0] : c.qualification,
    board: Array.isArray(c.board) ? c.board[0] : c.board,
    subject: Array.isArray(c.subject) ? c.subject[0] : c.subject,
  }))

  // Manually join teachers since PostgREST doesn't support joining auth.users easily
  const classes =
    classesData?.map((cls) => ({
      ...cls,
      teacher: profiles?.find((p) => p.id === cls.teacher_id),
    })) || []

  return <ClassesList classes={classes || []} />
}

async function CreateDialogLoader() {
  const supabase = await createClient()
  const [{ data: profiles }, { data: students }, { data: coursesData }] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('students').select('*').order('name'),
    supabase
      .from('courses')
      .select('*, qualification:qualifications(name), board:boards(name), subject:subjects(name)')
      .order('name'),
  ])

  const courses = (coursesData || []).map((c: any) => ({
    ...c,
    qualification: Array.isArray(c.qualification) ? c.qualification[0] : c.qualification,
    board: Array.isArray(c.board) ? c.board[0] : c.board,
    subject: Array.isArray(c.subject) ? c.subject[0] : c.subject,
  }))

  const teachers = profiles?.filter((p) => p.role === 'teacher') || []

  return (
    <CreateClassDialog
      teachers={teachers || []}
      students={students || []}
      courses={courses || []}
    />
  )
}

export default function AdminClassesPage() {
  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Manage Classes"
        description="Create classes, assign teachers, and enroll students."
        action={
          <Suspense fallback={<div className="w-[120px] h-10 bg-muted animate-pulse rounded-md" />}>
            <CreateDialogLoader />
          </Suspense>
        }
      />

      <Section>
        <Suspense fallback={<TableSkeleton />}>
          <ClassesContentLoader />
        </Suspense>
      </Section>
    </PageContainer>
  )
}
