import { getDirectoryData, getFilterOptions } from './actions'
import { AdminDirectoryClient } from './directory-client'

// Use revalidation instead of force-dynamic for better performance
// Data is cached via unstable_cache in actions
export const revalidate = 30

export default async function AdminStudentDirectoryPage() {
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
    getDirectoryData(initialFilters, 1, 20, 'admin'),
    getFilterOptions('admin')
  ])

  if (initialData.error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Error loading directory</h1>
        <p className="text-muted-foreground mt-2">{initialData.error}</p>
      </div>
    )
  }

  return (
    <AdminDirectoryClient 
      initialData={{
        students: initialData.students || [],
        count: initialData.count || 0
      }}
      filterOptions={filterOptions}
    />
  )
}
