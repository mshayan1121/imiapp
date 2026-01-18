'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getStudentProfileData(studentId: string) {
  try {
    const supabase = await createClient()
    
    // Get active term first
    const { data: activeTerm, error: termError } = await supabase
      .from('terms')
      .select('*')
      .eq('is_active', true)
      .single()

    if (termError) {
      console.error('Error fetching active term:', termError)
      throw new Error(`Failed to fetch active term: ${termError.message}`)
    }

    if (!activeTerm) throw new Error('No active term found')

    // 1. Student basic info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()

    if (studentError) throw studentError

    // 2. Enrolled classes and courses
    const { data: enrolledClasses, error: classesError } = await supabase
      .from('class_students')
      .select(`
        *,
        classes:class_id (
          id,
          name,
          teacher_id
        ),
        courses:course_id (
          id,
          name,
          qualifications:qualification_id (name),
          boards:board_id (name),
          subjects:subject_id (name)
        )
      `)
      .eq('student_id', studentId)

    if (classesError) throw classesError

    // Fetch teacher profiles for all classes
    const teacherIds = Array.from(new Set(
      (enrolledClasses || [])
        .map((ec: any) => {
          const cls = Array.isArray(ec.classes) ? ec.classes[0] : ec.classes
          return cls?.teacher_id
        })
        .filter(Boolean)
    )) as string[]

    const { data: teacherProfiles } = teacherIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', teacherIds)
      : { data: null }

    const teacherMap = new Map(
      (teacherProfiles || []).map((t: any) => [t.id, t])
    )

    const normalizedEnrolledClasses = (enrolledClasses || []).map((ec: any) => {
      const cls = ec.classes ? (Array.isArray(ec.classes) ? ec.classes[0] : ec.classes) : null
      const teacher = cls?.teacher_id ? teacherMap.get(cls.teacher_id) : null
      
      return {
        ...ec,
        classes: cls ? {
          ...cls,
          teacher: teacher ? { id: teacher.id, email: teacher.email, raw_user_meta_data: { full_name: teacher.full_name } } : null
        } : null,
        courses: ec.courses ? {
          ...(Array.isArray(ec.courses) ? ec.courses[0] : ec.courses),
          qualifications: ec.courses.qualifications ? (Array.isArray(ec.courses.qualifications) ? ec.courses.qualifications[0] : ec.courses.qualifications) : null,
          boards: ec.courses.boards ? (Array.isArray(ec.courses.boards) ? ec.courses.boards[0] : ec.courses.boards) : null,
          subjects: ec.courses.subjects ? (Array.isArray(ec.courses.subjects) ? ec.courses.subjects[0] : ec.courses.subjects) : null,
        } : null
      }
    })

    // 3. All grades for student (current term)
    const { data: gradesData, error: gradesError } = await supabase
      .from('grades')
      .select(`
        *,
        topics (id, name),
        subtopics (id, name),
        courses (
          id,
          name,
          qualifications:qualification_id (name),
          boards:board_id (name),
          subjects:subject_id (name)
        )
      `)
      .eq('student_id', studentId)
      .eq('term_id', activeTerm.id)
      .order('assessed_date', { ascending: false })

    if (gradesError) throw gradesError

    const normalizedGrades = (gradesData || []).map((g: any) => ({
    ...g,
    topics: g.topics ? (Array.isArray(g.topics) ? g.topics[0] : g.topics) : null,
    subtopics: g.subtopics ? (Array.isArray(g.subtopics) ? g.subtopics[0] : g.subtopics) : null,
    courses: g.courses ? {
      ...(Array.isArray(g.courses) ? g.courses[0] : g.courses),
      qualifications: g.courses.qualifications ? (Array.isArray(g.courses.qualifications) ? g.courses.qualifications[0] : g.courses.qualifications) : null,
      boards: g.courses.boards ? (Array.isArray(g.courses.boards) ? g.courses.boards[0] : g.courses.boards) : null,
      subjects: g.courses.subjects ? (Array.isArray(g.courses.subjects) ? g.courses.subjects[0] : g.courses.subjects) : null,
    } : null
  }))

    // 4. Contact information
    const { data: contacts, error: contactsError } = await supabase
      .from('student_contacts')
      .select('*')
      .eq('student_id', studentId)

    if (contactsError) throw contactsError

    // 5. Teacher notes
    const { data: notesData, error: notesError } = await supabase
      .from('student_notes')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (notesError) throw notesError

    // Fetch profiles for note creators
    const creatorIds = Array.from(new Set(
      (notesData || []).map((n: any) => n.created_by).filter(Boolean)
    )) as string[]

    const { data: noteCreatorProfiles } = creatorIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', creatorIds)
      : { data: null }

    const creatorMap = new Map(
      (noteCreatorProfiles || []).map((p: any) => [p.id, p])
    )

    const normalizedNotes = (notesData || []).map((n: any) => {
      const creator = n.created_by ? creatorMap.get(n.created_by) : null
      return {
        ...n,
        profiles: creator ? { email: creator.email, full_name: creator.full_name } : null
      }
    })

    return {
      student,
      enrolledClasses: normalizedEnrolledClasses,
      grades: normalizedGrades,
      contacts,
      notes: normalizedNotes,
      activeTerm
    }
  } catch (error: any) {
    console.error('Error in getStudentProfileData:', error)
    throw new Error(error?.message || 'Failed to load student profile data')
  }
}

export async function getCurriculumForCourse(courseId: string) {
  const supabase = await createClient()
  
  const { data: course } = await supabase
    .from('courses')
    .select('subject_id')
    .eq('id', courseId)
    .single()

  if (!course) throw new Error('Course not found')

  const { data: topics } = await supabase
    .from('topics')
    .select(`
      id,
      name,
      subtopics (
        id,
        name
      )
    `)
    .eq('subject_id', course.subject_id)
    .order('name')

  return topics || []
}

export async function addStudentNote(studentId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('student_notes')
    .insert({
      student_id: studentId,
      content,
      created_by: user.id
    })

  if (error) throw error
  revalidatePath(`/admin/students/${studentId}/profile`)
}

export async function updateStudentInfo(studentId: string, studentData: any) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .update(studentData)
    .eq('id', studentId)

  if (error) throw error
  revalidatePath(`/admin/students/${studentId}/profile`)
}

export async function updateStudentNote(noteId: string, content: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('student_notes')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', noteId)

  if (error) throw error
}

export async function deleteStudentNote(noteId: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('student_notes')
    .delete()
    .eq('id', noteId)

  if (error) throw error
  revalidatePath(`/admin/students/${studentId}/profile`)
}

export async function updateStudentContact(studentId: string, contactData: any) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('student_contacts')
    .select('id')
    .eq('student_id', studentId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('student_contacts')
      .update({ ...contactData, updated_at: new Date().toISOString() })
      .eq('student_id', studentId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('student_contacts')
      .insert({ ...contactData, student_id: studentId })
    if (error) throw error
  }
  revalidatePath(`/admin/students/${studentId}/profile`)
}

export async function logParentContact(studentId: string, contactData: any) {
  const supabase = await createClient()
  const { data: activeTerm } = await supabase
    .from('terms')
    .select('id')
    .eq('is_active', true)
    .single()

  if (!activeTerm) throw new Error('No active term found')

  const { error } = await supabase
    .from('parent_contacts')
    .insert({
      ...contactData,
      student_id: studentId,
      term_id: activeTerm.id,
      contacted_at: new Date().toISOString(),
      status: 'contacted'
    })

  if (error) throw error
  revalidatePath(`/admin/students/${studentId}/profile`)
}
