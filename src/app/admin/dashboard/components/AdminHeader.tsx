import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, Plus, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'

interface AdminHeaderProps {
  activeTerm: {
    name: string
    start_date: string
    end_date: string
  } | null
}

export function AdminHeader({ activeTerm }: AdminHeaderProps) {
  const action = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Quick Add
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/admin/students/directory">Student</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/users">Teacher</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/classes">Class</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/terms">Term</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const subtitle = activeTerm
    ? `Active Term: ${activeTerm.name} (${new Date(activeTerm.start_date).toLocaleDateString('en-GB')} - ${new Date(activeTerm.end_date).toLocaleDateString('en-GB')})`
    : 'No Active Term Set'

  return (
    <PageHeader
      title="Admin Dashboard"
      description="Overview and management of institute performance."
      action={action}
    >
      <div className="flex items-center gap-2 mt-3">
        {activeTerm ? (
          <Badge variant="info" className="flex items-center gap-1.5 py-1 px-3">
            <Calendar className="h-3.5 w-3.5" />
            {subtitle}
          </Badge>
        ) : (
          <Badge variant="danger" className="flex items-center gap-1.5 py-1 px-3">
            <AlertCircle className="h-3.5 w-3.5" />
            {subtitle}
          </Badge>
        )}
      </div>
    </PageHeader>
  )
}
