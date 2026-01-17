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
import { formatDistanceToNow } from 'date-fns'
import { User, Activity, Clock } from 'lucide-react'

interface TeacherData {
  id: string
  name: string
  classCount: number
  gradesEntered: number
  lastActivity: string | null
}

interface TeacherActivitySummaryProps {
  data: TeacherData[]
}

export function TeacherActivitySummary({ data }: TeacherActivitySummaryProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Teacher Activity Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Teacher Name</TableHead>
                <TableHead className="font-bold text-center">Classes</TableHead>
                <TableHead className="font-bold text-center">Grades Entered</TableHead>
                <TableHead className="font-bold">Last Activity</TableHead>
                <TableHead className="font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No teachers found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((teacher) => {
                  const isActive =
                    teacher.lastActivity &&
                    new Date().getTime() - new Date(teacher.lastActivity).getTime() <
                      7 * 24 * 60 * 60 * 1000

                  return (
                    <TableRow key={teacher.id} className="hover:bg-slate-50/50">
                      <TableCell className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-900">{teacher.name}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-slate-50 border-slate-200">
                          {teacher.classCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-slate-900">
                            {teacher.gradesEntered}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                            Entries
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">
                            {teacher.lastActivity
                              ? formatDistanceToNow(new Date(teacher.lastActivity), {
                                  addSuffix: true,
                                })
                              : 'No recent activity'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-100 border-none font-bold'
                          }
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
