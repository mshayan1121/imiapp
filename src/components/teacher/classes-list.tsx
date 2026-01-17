'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ClassDetailsDialog } from './class-details-dialog'

interface TeacherClassesListProps {
  classes: any[]
}

export function TeacherClassesList({ classes }: TeacherClassesListProps) {
  const [selectedClass, setSelectedClass] = useState<any>(null)

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg border-dashed">
            No classes assigned to you yet.
          </div>
        ) : (
          classes.map((cls) => (
            <Card
              key={cls.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedClass(cls)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{cls.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Calendar className="mr-2 h-3 w-3" />
                  Created {format(new Date(cls.created_at), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span className="font-medium text-foreground">
                      {cls.class_students?.length || cls.class_students?.[0]?.count || 0}
                    </span>
                    <span className="ml-1">Students</span>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ClassDetailsDialog
        open={!!selectedClass}
        onOpenChange={(open) => !open && setSelectedClass(null)}
        classId={selectedClass?.id}
        className={selectedClass?.name || ''}
      />
    </>
  )
}
