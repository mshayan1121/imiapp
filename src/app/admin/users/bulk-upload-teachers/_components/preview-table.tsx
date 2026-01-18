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
import { ParsedTeacher, TeacherImportStats } from '../_types'
import { CheckCircle, AlertTriangle, XCircle, ArrowUpDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PreviewTableProps {
  teachers: ParsedTeacher[]
  stats: TeacherImportStats
  selectedRows: Set<number>
  onSelectionChange: (selected: Set<number>) => void
  onReset: () => void
  onImport: () => void
  isImporting: boolean
}

type SortField = 'rowNumber' | 'fullName' | 'email' | 'status'
type SortOrder = 'asc' | 'desc'

export function PreviewTable({
  teachers,
  stats,
  selectedRows,
  onSelectionChange,
  onReset,
  onImport,
  isImporting
}: PreviewTableProps) {
  const [filter, setFilter] = useState<'all' | 'new' | 'duplicate' | 'error'>('all')
  const [sortField, setSortField] = useState<SortField>('rowNumber')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (filter === 'all') return true
      return t.validationStatus === filter
    })
  }, [teachers, filter])

  // Sort teachers
  const sortedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      // Handle string comparison case-insensitive
      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase()
        valB = valB.toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredTeachers, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set<number>()
      // Only select 'new' status teachers
      teachers.forEach(t => {
        if (t.validationStatus === 'new') {
          newSelected.add(t.rowNumber)
        }
      })
      onSelectionChange(newSelected)
    } else {
      onSelectionChange(new Set())
    }
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

  // Calculate if all selectable items are selected
  const allSelectableCount = teachers.filter(t => t.validationStatus === 'new').length
  const isAllSelected = allSelectableCount > 0 && selectedRows.size === allSelectableCount
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < allSelectableCount

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
      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All ({teachers.length})</TabsTrigger>
            <TabsTrigger value="new">New ({stats.newCount})</TabsTrigger>
            <TabsTrigger value="duplicate">Duplicates ({stats.duplicateCount})</TabsTrigger>
            <TabsTrigger value="error">Errors ({stats.errorCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="border rounded-md max-h-[70vh] overflow-auto relative">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  disabled={allSelectableCount === 0}
                  // Indeterminate state is not directly supported by this Checkbox component prop, 
                  // but we handle the logic. 
                />
              </TableHead>
              <TableHead className="w-[80px] cursor-pointer" onClick={() => handleSort('rowNumber')}>
                <div className="flex items-center gap-1">
                  Row # <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('fullName')}>
                <div className="flex items-center gap-1">
                  Name <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                <div className="flex items-center gap-1">
                  Email <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Validation Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No active teachers found matching filter.
                </TableCell>
              </TableRow>
            ) : (
              sortedTeachers.map((teacher) => (
                <TableRow key={teacher.rowNumber} className="hover:bg-gray-50/50">
                  <TableCell>
                    <Checkbox 
                      checked={selectedRows.has(teacher.rowNumber)}
                      onCheckedChange={(checked) => handleSelectRow(teacher.rowNumber, checked as boolean)}
                      disabled={teacher.validationStatus !== 'new'}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {teacher.rowNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    {teacher.fullName || <span className="text-red-400 italic">No name provided</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {teacher.email || <span className="text-red-400 italic">No email</span>}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(teacher.validationStatus)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {teacher.errors.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {teacher.errors.map((error, i) => (
                          <span key={i} className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {error}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <>
                        {teacher.validationStatus === 'new' && (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Ready to import
                          </span>
                        )}
                        {teacher.validationStatus === 'duplicate' && (
                          <span className="text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Email already exists
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
          Import {selectedRows.size} Teachers
        </Button>
      </div>
    </div>
  )
}
