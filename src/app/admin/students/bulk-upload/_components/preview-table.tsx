'use client'

import { useState, useMemo } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ParsedStudent, StudentImportStats } from '../_types'
import { CheckCircle, AlertTriangle, XCircle, ArrowUpDown, AlertCircle, Filter, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PreviewTableProps {
  students: ParsedStudent[]
  stats: StudentImportStats
  selectedRows: Set<number>
  onSelectionChange: (selected: Set<number>) => void
  onReset: () => void
  onImport: () => void
  isImporting: boolean
}

type SortField = 'rowNumber' | 'fullName' | 'yearGroup' | 'school' | 'email' | 'phone' | 'guardianName'
type SortOrder = 'asc' | 'desc'

export function PreviewTable({
  students,
  stats,
  selectedRows,
  onSelectionChange,
  onReset,
  onImport,
  isImporting
}: PreviewTableProps) {
  const [filter, setFilter] = useState<'all' | 'new' | 'duplicate' | 'error'>('all')
  const [selectedYearGroups, setSelectedYearGroups] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('rowNumber')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Get unique year groups for the filter
  const allYearGroups = useMemo(() => {
    const groups = new Set<string>()
    students.forEach(s => {
      if (s.yearGroup) groups.add(s.yearGroup)
    })
    return Array.from(groups).sort()
  }, [students])

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesStatus = filter === 'all' || s.validationStatus === filter
      const matchesYearGroup = selectedYearGroups.length === 0 || selectedYearGroups.includes(s.yearGroup)
      return matchesStatus && matchesYearGroup
    })
  }, [students, filter, selectedYearGroups])

  // Sort students
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase()
        valB = valB.toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredStudents, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      // Add all currently filtered/visible students that are 'new'
      filteredStudents.forEach(s => {
        if (s.validationStatus === 'new') {
          newSelected.add(s.rowNumber)
        }
      })
    } else {
      // Remove all currently filtered/visible students
      filteredStudents.forEach(s => {
        newSelected.delete(s.rowNumber)
      })
    }
    onSelectionChange(newSelected)
  }

  const handleSelectRow = (rowNumber: number, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(rowNumber)
    } else {
      newSelected.delete(rowNumber)
    }
    onSelectionChange(newSelected)
  }

  const selectableFilteredCount = filteredStudents.filter(s => s.validationStatus === 'new').length
  const selectedFilteredCount = filteredStudents.filter(s => selectedRows.has(s.rowNumber)).length
  const isAllSelected = selectableFilteredCount > 0 && selectedFilteredCount === selectableFilteredCount

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" /> New
          </Badge>
        )
      case 'duplicate':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 w-fit">
            <AlertTriangle className="h-3 w-3" /> Duplicate
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" /> Error
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All ({students.length})</TabsTrigger>
            <TabsTrigger value="new">New ({stats.newCount})</TabsTrigger>
            <TabsTrigger value="duplicate">Duplicates ({stats.duplicateCount})</TabsTrigger>
            <TabsTrigger value="error">Errors ({stats.errorCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 border-dashed">
                <Filter className="mr-2 h-4 w-4" />
                Year Groups
                {selectedYearGroups.length > 0 && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                      {selectedYearGroups.length}
                    </Badge>
                    <div className="hidden space-x-1 lg:flex">
                      {selectedYearGroups.length > 2 ? (
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                          {selectedYearGroups.length} selected
                        </Badge>
                      ) : (
                        allYearGroups
                          .filter((group) => selectedYearGroups.includes(group))
                          .map((group) => (
                            <Badge
                              variant="secondary"
                              key={group}
                              className="rounded-sm px-1 font-normal"
                            >
                              {group}
                            </Badge>
                          ))
                      )}
                    </div>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <div className="p-2 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Filter Years</span>
                  {selectedYearGroups.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedYearGroups([])}
                      className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 hover:bg-transparent"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-[300px] overflow-auto p-1">
                {allYearGroups.map((group) => (
                  <div
                    key={group}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      selectedYearGroups.includes(group) && "bg-accent/50"
                    )}
                    onClick={() => {
                      if (selectedYearGroups.includes(group)) {
                        setSelectedYearGroups(selectedYearGroups.filter(g => g !== group))
                      } else {
                        setSelectedYearGroups([...selectedYearGroups, group])
                      }
                    }}
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selectedYearGroups.includes(group) ? "bg-primary text-primary-foreground" : "opacity-50"
                    )}>
                      {selectedYearGroups.includes(group) && <Check className="h-3 w-3" />}
                    </div>
                    <span>{group}</span>
                  </div>
                ))}
              </div>
              {selectedYearGroups.length > 0 && (
                <div className="p-1 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-xs text-blue-600"
                    onClick={() => handleSelectAll(true)}
                  >
                    Select All {selectedYearGroups.join(', ')}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => handleSelectAll(true)}
            disabled={selectableFilteredCount === 0}
            className="h-9"
          >
            Select All Visible
          </Button>

          {selectedRows.size > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onSelectionChange(new Set())}
              className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear All ({selectedRows.size})
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md max-h-[70vh] overflow-auto relative">
        <Table className="min-w-[1500px]">
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[50px] px-4">
                <Checkbox 
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  disabled={selectableFilteredCount === 0}
                />
              </TableHead>
              <TableHead className="w-[60px] px-2 cursor-pointer" onClick={() => handleSort('rowNumber')}>
                <div className="flex items-center gap-1">
                  Row # <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="min-w-[200px] px-4 cursor-pointer" onClick={() => handleSort('fullName')}>
                <div className="flex items-center gap-1">
                  Name <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="min-w-[150px] px-4 cursor-pointer" onClick={() => handleSort('yearGroup')}>
                <div className="flex items-center gap-1">
                  Year Group <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="min-w-[150px] px-4 cursor-pointer" onClick={() => handleSort('school')}>
                <div className="flex items-center gap-1">
                  School <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="min-w-[200px] px-4 cursor-pointer" onClick={() => handleSort('email')}>
                <div className="flex items-center gap-1">
                  Email <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="min-w-[150px] px-4 cursor-pointer" onClick={() => handleSort('phone')}>
                <div className="flex items-center gap-1">
                  Phone <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="min-w-[200px] px-4 cursor-pointer" onClick={() => handleSort('guardianName')}>
                <div className="flex items-center gap-1">
                  Guardian <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="w-[120px] px-4">Status</TableHead>
              <TableHead className="px-4">Validation Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No students found matching filter.
                </TableCell>
              </TableRow>
            ) : (
              sortedStudents.map((student) => (
                <TableRow key={student.rowNumber} className="hover:bg-gray-50/50">
                  <TableCell className="px-4">
                    <Checkbox 
                      checked={selectedRows.has(student.rowNumber)}
                      onCheckedChange={(checked) => handleSelectRow(student.rowNumber, checked as boolean)}
                      disabled={student.validationStatus !== 'new'}
                    />
                  </TableCell>
                  <TableCell className="px-2 text-muted-foreground text-xs">
                    {student.rowNumber}
                  </TableCell>
                  <TableCell className="px-4 font-medium">
                    {student.fullName || <span className="text-red-400 italic">No name provided</span>}
                  </TableCell>
                  <TableCell className="px-4">
                    {student.yearGroup || <span className="text-gray-400 italic">None</span>}
                  </TableCell>
                  <TableCell className="px-4">
                    {student.school || <span className="text-gray-400 italic">None</span>}
                  </TableCell>
                  <TableCell className="px-4 text-sm">
                    {student.email || <span className="text-gray-400 italic">None</span>}
                  </TableCell>
                  <TableCell className="px-4 text-sm">
                    {student.phone || <span className="text-gray-400 italic">None</span>}
                  </TableCell>
                  <TableCell className="px-4 text-sm">
                    {student.guardianName || <span className="text-gray-400 italic">None</span>}
                  </TableCell>
                  <TableCell className="px-4">
                    {getStatusBadge(student.validationStatus)}
                  </TableCell>
                  <TableCell className="px-4 text-sm">
                    {student.errors.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {student.errors.map((error, i) => (
                          <span key={i} className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {error}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <>
                        {student.validationStatus === 'new' && (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Ready to import
                          </span>
                        )}
                        {student.validationStatus === 'duplicate' && (
                          <span className="text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Student already exists
                          </span>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onReset} disabled={isImporting}>
          Upload Different File
        </Button>
        <Button 
          onClick={onImport} 
          disabled={selectedRows.size === 0 || isImporting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Import {selectedRows.size} Students
        </Button>
      </div>
    </div>
  )
}
