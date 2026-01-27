'use client'

import { useState, Fragment, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  ArrowUpDown,
  Trash2,
  Pencil,
  Eye,
  LineChart,
  PlusCircle,
  Flag as FlagIcon,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { StudentWithStats } from '@/types/students'
import { StudentDialog } from '@/components/admin/student-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'

interface StudentDirectoryTableProps {
  data: StudentWithStats[]
  role: 'admin' | 'teacher'
  onDelete?: (id: string) => Promise<void>
  onBulkDelete?: (ids: string[]) => Promise<void>
  onBulkEnroll?: (ids: string[]) => Promise<void>
  onAddGrade?: (studentId: string) => void
  currentPage: number
  pageCount: number
  onPageChange: (page: number) => void
}

export const StudentDirectoryTable = memo(function StudentDirectoryTable({
  data,
  role,
  onDelete,
  onBulkDelete,
  onBulkEnroll,
  onAddGrade,
  currentPage,
  pageCount,
  onPageChange,
}: StudentDirectoryTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const toggleRowExpanded = useCallback((id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const columns: ColumnDef<StudentWithStats>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Student Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto font-semibold hover:underline text-blue-600"
            onClick={() => router.push(`/${role}/students/${row.original.id}/profile`)}
          >
            {row.original.name}
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'year_group',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Year Group
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <Badge variant="outline">{row.original.year_group}</Badge>,
    },
    {
      accessorKey: 'school',
      header: 'School',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.school}</span>,
    },
    {
      id: 'classes',
      header: 'Classes',
      cell: ({ row }) => {
        const classes = row.original.class_students
        if (classes.length === 0) return <span className="text-xs text-muted-foreground italic">None</span>
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-0 flex items-center gap-1"
                  onClick={() => toggleRowExpanded(row.original.id)}
                >
                  {classes.length} class{classes.length > 1 ? 'es' : ''}
                  {expandedRows[row.original.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <ul className="text-xs space-y-1">
                  {classes.map((c, i) => (
                    <li key={i}>{c.class.name} ({c.course.name})</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: 'stats.total_grades',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Grades
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.stats.total_grades}</span>,
    },
    {
      accessorKey: 'stats.low_points',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          LPs
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const lps = row.original.stats.low_points
        return lps > 0 ? (
          <Badge variant="destructive" className="font-bold">
            {lps}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">0</span>
        )
      },
    },
    {
      accessorKey: 'stats.flag_count',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Flags
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const flags = row.original.stats.flag_count
        if (flags === 0) return <span className="text-sm text-muted-foreground">0</span>
        return (
          <div className="flex items-center gap-1 text-orange-600">
            <FlagIcon className="h-4 w-4 fill-current" />
            <span className="font-bold">{flags}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'stats.average_percentage',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Avg %
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const avg = row.original.stats.average_percentage
        return (
          <span className={cn(
            "font-bold text-sm",
            avg >= 80 ? "text-green-600" : avg >= 70 ? "text-yellow-600" : "text-red-600"
          )}>
            {avg.toFixed(1)}%
          </span>
        )
      },
    },
    {
      accessorKey: 'stats.status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.stats.status
        return (
          <Badge className={cn(
            status === 'On Track' ? "bg-green-100 text-green-800 border-green-200" :
            status === 'At Risk' ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
            "bg-red-100 text-red-800 border-red-200"
          )}>
            {status}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const student = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/${role}/students/${student.id}/profile`)}>
                <Eye className="mr-2 h-4 w-4" /> View Profile
              </DropdownMenuItem>
              {role === 'teacher' && (
                <>
                  <DropdownMenuItem onClick={() => router.push(`/teacher/progress/${student.id}`)}>
                    <LineChart className="mr-2 h-4 w-4" /> View Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddGrade?.(student.id)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Grade
                  </DropdownMenuItem>
                </>
              )}
              {role === 'admin' && (
                <>
                  <StudentDialog 
                    student={student} 
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit Student
                      </DropdownMenuItem>
                    } 
                  />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onDelete?.(student.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [role, router, toggleRowExpanded, onAddGrade, onDelete])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  })

  const selectedCount = Object.keys(rowSelection).length

  // Get actual student IDs from selected rows
  const getSelectedStudentIds = useCallback(() => {
    return table.getFilteredSelectedRowModel().rows.map((row) => row.original.id)
  }, [table])

  return (
    <div className="space-y-4">
      {selectedCount > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-muted/50 rounded-md border border-dashed animate-in fade-in slide-in-from-top-1">
          <span className="text-sm font-medium sm:ml-2">{selectedCount} students selected</span>
          <div className="ml-auto flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {role === 'admin' && (
              <>
                <Button size="sm" variant="outline" onClick={() => onBulkEnroll?.(getSelectedStudentIds())} className="w-full sm:w-auto min-h-[44px]">
                  Enroll in Class
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onBulkDelete?.(getSelectedStudentIds())} className="w-full sm:w-auto min-h-[44px]">
                  Delete Selected
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" className="w-full sm:w-auto min-h-[44px]">Export Selected</Button>
          </div>
        </div>
      )}

      <div className="rounded-md border bg-white overflow-hidden overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(expandedRows[row.original.id] && "bg-muted/30 border-b-0")}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRows[row.original.id] && (
                    <TableRow key={`${row.id}-expanded`} className="bg-muted/30">
                      <TableCell colSpan={columns.length}>
                        <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                              Classes & Courses
                            </h4>
                            <ul className="space-y-2">
                              {row.original.class_students.map((cs, i) => (
                                <li key={i} className="text-sm flex flex-col p-2 rounded bg-white border">
                                  <span className="font-medium">{cs.class.name}</span>
                                  <span className="text-xs text-muted-foreground">{cs.course.name}</span>
                                  {cs.class.teacher && (
                                    <span className="text-xs mt-1 italic text-muted-foreground">
                                      Teacher: {cs.class.teacher.full_name}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                              Recent Performance
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-sm">
                                <span>Average Score</span>
                                <span className="font-bold">{row.original.stats.average_percentage.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span>Total Assessments</span>
                                <span>{row.original.stats.total_grades}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span>Status</span>
                                <Badge variant="outline">{row.original.stats.status}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => router.push(`/${role}/students/${row.original.id}/profile`)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View Full Profile
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-[400px] text-center">
                  <EmptyState
                    title="No students found"
                    description="Try adjusting your filters or search query."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing page {currentPage} of {pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= pageCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
})
