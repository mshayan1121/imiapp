'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { classSchema } from '@/lib/schemas'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata.role !== 'admin') {
    throw new Error('Not authorized')
  }
  return supabase
}

// Fetch teachers for dropdown
export async function getTeachers() {
  const supabase = await checkAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, full_name')
    .eq('role', 'teacher')

  if (error) throw error
  return data
}

// Create Class
export async function createClass(formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const teacherId = formData.get('teacherId') as string

    const validated = classSchema.safeParse({ name, teacher_id: teacherId })
    if (!validated.success) {
      return { error: 'Invalid class data: ' + validated.error.issues[0].message }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be logged in to create a class.' }

    // Create the class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .insert({
        name,
        teacher_id: teacherId,
        created_by: user.id,
      })
      .select()
      .single()

    if (classError) {
      console.error('Database Error:', classError)
      return { error: 'Failed to create class. Please try again.' }
    }

    const studentsJson = formData.get('students') as string
    if (studentsJson) {
      try {
        const students = JSON.parse(studentsJson)
        if (students.length > 0) {
          const classStudents = students.map((s: any) => ({
            class_id: classData.id,
            student_id: s.studentId,
            course_id: s.courseId,
          }))

          const { error: studentsError } = await supabase
            .from('class_students')
            .insert(classStudents)

          if (studentsError) {
            console.error('Database Error:', studentsError)
            // We still created the class, but failed to add students
            return { error: 'Class created but failed to add some students.' }
          }
        }
      } catch (parseError) {
        console.error('Parse Error:', parseError)
        return { error: 'Class created but failed to process student list.' }
      }
    }

    revalidatePath('/admin/classes')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateClass(id: string, formData: FormData) {
  try {
    const supabase = await createClient()

    const rawData = {
      name: formData.get('name') as string,
      teacher_id: formData.get('teacherId') as string,
    }

    const validated = classSchema.safeParse(rawData)

    if (!validated.success) {
      return { error: 'Invalid data: ' + validated.error.issues[0].message }
    }

    const { error } = await supabase.from('classes').update(validated.data).eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to update class: ' + error.message }
    }

    revalidatePath('/admin/classes')
    return { success: true }
  } catch (error) {
    console.error('Server Error:', error)
    return { error: 'Internal Server Error' }
  }
}

export async function deleteClass(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('classes').delete().eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to delete class: ' + error.message }
    }

    revalidatePath('/admin/classes')
    return { success: true }
  } catch (error) {
    console.error('Server Error:', error)
    return { error: 'Internal Server Error' }
  }
}

export async function addStudentToClass(classId: string, studentData: any) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('class_students').insert({
      class_id: classId,
      student_id: studentData.studentId,
      course_id: studentData.courseId,
    })

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to add student to class. Please try again.' }
    }

    revalidatePath('/admin/classes')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function removeStudentFromClass(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('class_students').delete().eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to remove student from class. Please try again.' }
    }

    revalidatePath('/admin/classes')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateStudentCourse(id: string, courseId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('class_students')
      .update({
        course_id: courseId,
      })
      .eq('id', id)

    if (error) {
      console.error('Database Error:', error)
      return { error: 'Failed to update student course. Please try again.' }
    }

    revalidatePath('/admin/classes')
    return { success: true }
  } catch (err) {
    console.error('Unexpected Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function getClassDetails(classId: string) {
  const supabase = await createClient()

  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, name, teacher_id, created_at')
    .eq('id', classId)
    .single()

  if (classError) throw classError

  const { data: students, error: studentsError } = await supabase
    .from('class_students')
    .select(
      `
      *,
      student:students(*),
      course:courses(
        id,
        name,
        qualification:qualifications(name),
        board:boards(name),
        subject:subjects(name)
      )
    `,
    )
    .eq('class_id', classId)
    .order('enrolled_at', { ascending: false })

  if (studentsError) throw studentsError

  const normalizedStudents = (students || []).map((s: any) => ({
    ...s,
    student: Array.isArray(s.student) ? s.student[0] : s.student,
    course: s.course ? {
      ...(Array.isArray(s.course) ? s.course[0] : s.course),
      qualification: Array.isArray((Array.isArray(s.course) ? s.course[0] : s.course).qualification)
        ? (Array.isArray(s.course) ? s.course[0] : s.course).qualification[0]
        : (Array.isArray(s.course) ? s.course[0] : s.course).qualification,
      board: Array.isArray((Array.isArray(s.course) ? s.course[0] : s.course).board)
        ? (Array.isArray(s.course) ? s.course[0] : s.course).board[0]
        : (Array.isArray(s.course) ? s.course[0] : s.course).board,
      subject: Array.isArray((Array.isArray(s.course) ? s.course[0] : s.course).subject)
        ? (Array.isArray(s.course) ? s.course[0] : s.course).subject[0]
        : (Array.isArray(s.course) ? s.course[0] : s.course).subject,
    } : null
  }))

  return { ...classData, students: normalizedStudents }
}

export async function getClassPerformanceData(classId: string) {
  const supabase = await createClient()

  // Get active term
  const { data: activeTerm } = await supabase
    .from('terms')
    .select('id, name, is_active')
    .eq('is_active', true)
    .single()

  // Get class data
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, name, teacher_id')
    .eq('id', classId)
    .single()

  if (classError) throw classError

  // Get teacher profile separately
  let teacher = null
  if (classData.teacher_id) {
    const { data: teacherData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', classData.teacher_id)
      .single()
    teacher = teacherData
  }

  // Get student count
  const { count: studentCount } = await supabase
    .from('class_students')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', classId)

  // Get grades for active term if available
  let grades: any[] = []
  if (activeTerm) {
    const { data: gradesData } = await supabase
      .from('grades')
      .select('percentage, is_low_point, student_id')
      .eq('class_id', classId)
      .eq('term_id', activeTerm.id)
      .limit(1000)

    grades = gradesData || []
  }

  // Calculate performance metrics
  const avgPercentage = grades.length > 0
    ? Math.round(grades.reduce((acc: number, g: any) => acc + Number(g.percentage), 0) / grades.length)
    : 0

  const lpCount = grades.filter((g: any) => g.is_low_point).length

  // Calculate flags: count students with 3+ LPs
  const studentLpCounts: Record<string, number> = {}
  grades.forEach((g: any) => {
    if (g.is_low_point) {
      studentLpCounts[g.student_id] = (studentLpCounts[g.student_id] || 0) + 1
    }
  })

  const flagCount = Object.values(studentLpCounts).filter((count) => count >= 3).length

  return {
    avgPercentage,
    gradesEntered: grades.length,
    lpCount,
    flagCount,
    studentCount: studentCount || 0,
    teacher: teacher || null,
  }
}
