import { createClient } from '@/utils/supabase/server'
import { CurriculumManagerTree } from '@/components/admin/curriculum/curriculum-manager-tree'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'

export default async function ManageCurriculumPage() {
  const supabase = await createClient()

  const [
    { data: qualifications },
    { data: boards },
    { data: subjects },
    { data: topics },
    { data: subtopics },
    { data: courses },
  ] = await Promise.all([
    supabase.from('qualifications').select('*').order('name'),
    supabase.from('boards').select('*').order('name'),
    supabase.from('subjects').select('*').order('name'),
    supabase.from('topics').select('*').order('name'),
    supabase.from('subtopics').select('*').order('name'),
    supabase
      .from('courses')
      .select(
        `
      *,
      qualification:qualifications(name),
      board:boards(name),
      subject:subjects(name)
    `,
      )
      .order('created_at', { ascending: false }),
  ])

  return (
    <PageContainer className="animate-in fade-in duration-500">
      <PageHeader
        title="Curriculum Management"
        description="View and manage the hierarchical structure of qualifications, boards, subjects, and topics."
      />

      <CurriculumManagerTree
        qualifications={qualifications || []}
        boards={boards || []}
        subjects={subjects || []}
        topics={topics || []}
        subtopics={subtopics || []}
        courses={courses || []}
      />
    </PageContainer>
  )
}
