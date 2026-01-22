'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { ParentContact, StudentProgressSummary } from '@/types/grades'

export async function getFlaggedStudents(termId: string) {
  const supabase = await createClient()

  // First, get all students and their flags for the term
  const { data: classes } = await supabase.from('classes').select('id')

  if (!classes) return []

  const allProgress = await Promise.all(
    classes.map((c) =>
      supabase.rpc('get_student_progress_summary', {
        p_class_id: c.id,
        p_term_id: termId,
      }),
    ),
  )

  const flaggedStudents = allProgress
    .flatMap((res) => (res.data || []) as StudentProgressSummary[])
    .filter((s) => s.flag_count >= 1)

  // Get contact status for these students
  const studentIds = flaggedStudents.map((s) => s.student_id)
  const { data: contacts } = studentIds.length > 0
    ? await supabase
        .from('parent_contacts')
        .select('id, student_id, term_id, contact_type, status, contacted_at, updated_at, notes')
        .eq('term_id', termId)
        .in('student_id', studentIds)
        .limit(500)
    : { data: [] }

  return flaggedStudents.map((s) => ({
    ...s,
    contacts: (contacts || []).filter((c) => c.student_id === s.student_id) as ParentContact[],
  }))
}

export async function updateContactStatus(params: {
  student_id: string
  term_id: string
  contact_type: 'message' | 'call' | 'meeting'
  status: 'pending' | 'contacted' | 'resolved'
  notes?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('parent_contacts')
    .upsert({
      ...params,
      contacted_at: params.status === 'contacted' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .select()

  if (error) throw error
  revalidatePath('/admin/flags')
  return data
}
