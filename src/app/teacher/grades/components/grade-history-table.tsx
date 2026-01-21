'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Eye, MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { EditGradeDialog } from './edit-grade-dialog'
import { deleteGrade } from '../actions'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface GradeHistoryTableProps {
  data: any[]
  onUpdate: () => void
}

export function GradeHistoryTable({ data, onUpdate }: GradeHistoryTableProps) {
  const [editingGrade, setEditingGrade] = useState<any>(null)
  const [deletingGrade, setDeletingGrade] = useState<any>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleDelete = async () => {
    if (!deletingGrade) return
    try {
      await deleteGrade(deletingGrade.id)
      toast.success('Grade deleted successfully')
      onUpdate()
    } catch (error) {
      toast.error('Failed to delete grade')
    } finally {
      setDeletingGrade(null)
    }
  }

  return (
    <div className="rounded-md border overflow-hidden bg-background">
      <div className="overflow-x-auto">
        <Table className="min-w-[1200px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead className="min-w-[150px]">Student</TableHead>
              <TableHead className="min-w-[120px]">Course</TableHead>
              <TableHead className="min-w-[200px]">Topic / Subtopic</TableHead>
              <TableHead className="min-w-[120px]">Type</TableHead>
              <TableHead className="w-[110px] text-right whitespace-nowrap shrink-0">Marks</TableHead>
              <TableHead className="w-[80px] text-right whitespace-nowrap shrink-0">%</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[100px] whitespace-nowrap">Date</TableHead>
              <TableHead className="min-w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  No grades found matching the current filters.
                </TableCell>
              </TableRow>
            ) : (
              data.map((grade) => (
                <>
                  <TableRow key={grade.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <button
                        onClick={() => toggleRow(grade.id)}
                        className="p-1 hover:bg-accent rounded-md transition-colors"
                      >
                        {expandedRows.has(grade.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{grade.students?.name}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{grade.courses?.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{grade.topics?.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{grade.subtopics?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[10px] uppercase py-0 h-4 whitespace-nowrap">
                          {grade.work_type}
                        </Badge>
                        <Badge variant="secondary" className="w-fit text-[10px] uppercase py-0 h-4 whitespace-nowrap">
                          {grade.work_subtype}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono whitespace-nowrap text-sm w-[110px] shrink-0">
                      {grade.marks_obtained} / {grade.total_marks}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap shrink-0">
                      <span
                        className={`font-bold ${grade.is_low_point ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {grade.percentage}%
                      </span>
                    </TableCell>
                  <TableCell>
                    {grade.is_low_point ? (
                      <Badge
                        variant="destructive"
                        className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
                      >
                        Low Point
                      </Badge>
                    ) : (
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                      >
                        Pass
                      </Badge>
                    )}
                    {grade.attempt_number > 1 && (
                      <span className="ml-2 text-[10px] text-muted-foreground">
                        Attempt {grade.attempt_number}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(grade.assessed_date), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditingGrade(grade)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingGrade(grade)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleRow(grade.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {expandedRows.has(grade.id) && (
                  <TableRow className="bg-muted/20 border-t-0">
                    <TableCell colSpan={10} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                            Assessment Details
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Topic</p>
                              <p className="font-medium">{grade.topics?.name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Subtopic</p>
                              <p className="font-medium">{grade.subtopics?.name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Work Type</p>
                              <p className="font-medium capitalize">{grade.work_type}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Work Subtype</p>
                              <p className="font-medium capitalize">{grade.work_subtype}</p>
                            </div>
                          </div>
                          {grade.notes && (
                            <div className="pt-2">
                              <p className="text-muted-foreground text-sm">Teacher Notes</p>
                              <div className="mt-1 p-3 bg-background border rounded-md text-sm italic">
                                &quot;{grade.notes}&quot;
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                            Attempt History
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 rounded-md bg-background border">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${grade.is_low_point ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                                >
                                  {grade.percentage}%
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    Attempt {grade.attempt_number} (Latest)
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(grade.assessed_date), 'dd MMM yyyy')}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                CURRENT
                              </Badge>
                            </div>
                            {/* If there were other attempts, we'd list them here */}
                            <p className="text-xs text-muted-foreground text-center py-4">
                              No previous attempts found for this assessment.
                            </p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
        </Table>
      </div>

      <EditGradeDialog
        grade={editingGrade}
        open={!!editingGrade}
        onOpenChange={(open) => !open && setEditingGrade(null)}
        onSuccess={onUpdate}
      />

      <AlertDialog open={!!deletingGrade} onOpenChange={(open) => !open && setDeletingGrade(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the grade for{' '}
              <span className="font-bold text-foreground">{deletingGrade?.students?.name}</span> in{' '}
              <span className="font-bold text-foreground">{deletingGrade?.subtopics?.name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
