import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface GradeEntry {
  id: string
  assessed_date: string
  marks_obtained: number
  total_marks: number
  percentage: number
  is_low_point: boolean
  students: { name: string } | null
  classes: { name: string } | null
  topics: { name: string } | null
  subtopics: { name: string } | null
}

interface RecentActivityTableProps {
  grades: GradeEntry[]
}

export function RecentActivityTable({ grades }: RecentActivityTableProps) {
  if (grades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No grades entered yet</h3>
          <p className="text-gray-500 max-w-sm">
            Start by entering grades for your students to see your recent activity here.
          </p>
          <Link href="/teacher/grades/entry" className="mt-4">
            <Badge
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
            >
              Enter First Grade
            </Badge>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
        <Link
          href="/teacher/grades"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          View All Grades <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Topic - Subtopic</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(grade.assessed_date).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell className="font-medium">{grade.students?.name}</TableCell>
                  <TableCell>{grade.classes?.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <span className="font-medium">{grade.topics?.name}</span>
                    <span className="text-muted-foreground block text-xs truncate">
                      {grade.subtopics?.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {grade.marks_obtained}/{grade.total_marks}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-bold',
                          grade.percentage < 80 ? 'text-red-600' : 'text-green-600',
                        )}
                      >
                        {Math.round(grade.percentage)}%
                      </span>
                      {grade.is_low_point && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1 bg-red-50 text-red-700 border-red-100 uppercase font-bold"
                        >
                          LP
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
