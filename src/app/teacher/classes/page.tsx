import { createClient } from '@/utils/supabase/server'
import { TeacherClassesList } from '@/components/teacher/classes-list'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Section } from '@/components/layout/section'

export default async function TeacherClassesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in</div>
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  let classes = []
  let fetchError = null

  // Try fetching with full details first
  const { data: fullData, error: fullError } = await supabase
    .from('classes')
    .select(
      `
      *,
      class_students (
        id,
        student:student_id (
          id,
          name,
          year_group,
          school
        ),
        course:course_id (
          id,
          name,
          qualification:qualification_id (name),
          board:board_id (name),
          subject:subject_id (name)
        )
      )
    `,
    )
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  if (fullError) {
    console.error('Error fetching full teacher classes:', fullError)
    // Fallback to simple fetch if RLS on nested resources fails
    const { data: simpleData, error: simpleError } = await supabase
      .from('classes')
      .select('*, class_students(count)')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (simpleError) {
      console.error('Error fetching simple teacher classes:', simpleError)
      fetchError = simpleError
    } else {
      classes = simpleData || []
    }
  } else {
    classes = fullData || []
  }

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader title="My Classes" description="View your assigned classes and student lists." />

      <Section>
        <TeacherClassesList classes={classes || []} />
      </Section>
    </PageContainer>
  )
}
