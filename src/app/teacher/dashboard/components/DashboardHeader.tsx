import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'

interface DashboardHeaderProps {
  teacherName: string
  activeTermName: string
}

export function DashboardHeader({ teacherName, activeTermName }: DashboardHeaderProps) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const subtitle = (
    <div className="flex items-center gap-3 mt-2 text-gray-600">
      <span className="text-sm font-medium">{today}</span>
      <span className="text-gray-300">|</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Current Term:</span>
        <Badge variant="info" className="font-semibold">
          {activeTermName}
        </Badge>
      </div>
    </div>
  )

  const action = (
    <Link href="/teacher/grades/entry">
      <Button size="lg" className="shadow-sm">
        <PlusCircle className="mr-2 h-5 w-5" />
        Enter Grades
      </Button>
    </Link>
  )

  return (
    <PageHeader title={`Welcome back, ${teacherName}`} action={action}>
      {subtitle}
    </PageHeader>
  )
}
