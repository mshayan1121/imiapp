import { createClient } from '@/utils/supabase/server'
import { getDirectoryData, getFilterOptions } from '@/app/admin/students/directory/actions'
import { TeacherDirectoryClient } from './teacher-directory-client'
import { redirect } from 'next/navigation'

// Use revalidation instead of force-dynamic for better performance
// Data is cached via unstable_cache in actions
export const revalidate = 30

export default async function TeacherStudentsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const initialFilters = {
    search: '',
    year_group: '',
    school: '',
    class_id: '',
    course_id: '',
    enrollment_status: '',
    performance: '',
    flag_status: '',
  }

  const [initialData, filterOptions] = await Promise.all([
    getDirectoryData(initialFilters, 1, 20, 'teacher', user.id),
    getFilterOptions('teacher', user.id)
  ])

  if (initialData.error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Error loading students</h1>
        <p className="text-muted-foreground mt-2">{initialData.error}</p>
      </div>
    )
  }

  return (
    <TeacherDirectoryClient 
      teacherId={user.id}
      initialData={{
        students: initialData.students || [],
        count: initialData.count || 0
      }}
      filterOptions={filterOptions}
    />
  )
}
