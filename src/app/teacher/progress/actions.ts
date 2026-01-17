'use server'

import { createClient } from '@/utils/supabase/server'
import { StudentProgressSummary, Grade, Student } from '@/types/grades'

export async function getClassProgress(
  classId: string,
  termId: string,
): Promise<StudentProgressSummary[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_student_progress_summary', {
    p_class_id: classId,
    p_term_id: termId,
  })

  if (error) throw error
  return (data || []) as StudentProgressSummary[]
}

export async function getStudentDetailProgress(studentId: string, termId: string) {
  const supabase = await createClient()

  // Get student info
  const { data: studentInfo } = await supabase
    .from('students')
    .select(
      `
      *,
      class_students (
        courses (id, name)
      )
    `,
    )
    .eq('id', studentId)
    .single()

  // Get all grades for this student in this term
  const { data: grades } = await supabase
    .from('grades')
    .select(
      `
      *,
      topics (id, name),
      subtopics (id, name)
    `,
    )
    .eq('student_id', studentId)
    .eq('term_id', termId)
    .order('assessed_date', { ascending: true })

  const typedGrades = (grades || []) as Grade[]

  // Calculate stats
  const totalGrades = typedGrades.length
  const totalLP = typedGrades.filter((g) => g.is_low_point).length
  const avgPercentage =
    totalGrades > 0
      ? typedGrades.reduce((acc, g) => acc + Number(g.percentage), 0) / totalGrades
      : 0

  // Group by topic/subtopic for performance analysis
  const performanceByTopic: Record<string, any> = {}
  typedGrades.forEach((g) => {
    const topicName = g.topics?.name || 'Unknown Topic'
    const subtopicName = g.subtopics?.name || 'Unknown Subtopic'
    const key = `${topicName} - ${subtopicName}`

    if (!performanceByTopic[key]) {
      performanceByTopic[key] = {
        name: key,
        topic: topicName,
        subtopic: subtopicName,
        count: 0,
        best: 0,
        latest: 0,
        avg: 0,
        lpCount: 0,
        scores: [] as number[],
      }
    }
    const p = performanceByTopic[key]
    p.count++
    p.best = Math.max(p.best, g.percentage)
    p.latest = g.percentage // Since they are ordered by date
    p.lpCount += g.is_low_point ? 1 : 0
    p.scores.push(g.percentage)
    p.avg = p.scores.reduce((a: number, b: number) => a + b, 0) / p.count
  })

  return {
    studentInfo: studentInfo as Student & { class_students: any[] },
    overallStats: {
      totalGrades,
      totalLP,
      averagePercentage: Math.round(avgPercentage * 10) / 10,
    },
    topicPerformance: Object.values(performanceByTopic),
    gradeTimeline: typedGrades,
  }
}
