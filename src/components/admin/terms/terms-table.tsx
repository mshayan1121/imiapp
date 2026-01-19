'use client'

import { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
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
import { Input } from '@/components/ui/input'
import { Term, getColumns } from './columns'
import { TermDialog } from './term-dialog'
import { setActiveTerm, deleteTerm } from '@/app/admin/terms/actions'
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

interface TermsTableProps {
  data: Term[]
}

export function TermsTable({ data }: TermsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'start_date', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<Term | null>(null)

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [termToDelete, setTermToDelete] = useState<Term | null>(null)

  const [activeAlertOpen, setActiveAlertOpen] = useState(false)
  const [termToActivate, setTermToActivate] = useState<Term | null>(null)

  const activeTerm = data.find((t) => t.is_active)

  const handleEdit = (term: Term) => {
    setEditingTerm(term)
    setDialogOpen(true)
  }

  const handleDeleteClick = (term: Term) => {
    setTermToDelete(term)
    setDeleteAlertOpen(true)
  }

  const handleSetActiveClick = (term: Term) => {
    setTermToActivate(term)
    setActiveAlertOpen(true)
  }

  const confirmDelete = async () => {
    if (!termToDelete) return

    const result = await deleteTerm(termToDelete.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Term deleted')
    }
    setDeleteAlertOpen(false)
    setTermToDelete(null)
  }

  const confirmSetActive = async () => {
    if (!termToActivate) return

    const result = await setActiveTerm(termToActivate.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Active term updated')
    }
    setActiveAlertOpen(false)
    setTermToActivate(null)
  }

  const columns = getColumns({
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    onSetActive: handleSetActiveClick,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Input
          placeholder="Filter by academic year..."
          value={(table.getColumn('academic_year')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('academic_year')?.setFilterValue(event.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Button
          onClick={() => {
            setEditingTerm(null)
            setDialogOpen(true)
          }}
          className="w-full sm:w-auto min-h-[44px]"
        >
          Create Term
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No terms found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2 sm:space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="flex-1 sm:flex-initial min-h-[44px]"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="flex-1 sm:flex-initial min-h-[44px]"
        >
          Next
        </Button>
      </div>

      <TermDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        term={editingTerm}
        onSuccess={() => {}}
      />

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting this term will remove all associated grades and
              Low Points.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={activeAlertOpen} onOpenChange={setActiveAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as Active Term?</AlertDialogTitle>
            <AlertDialogDescription>
              Setting this as active will deactivate{' '}
              {activeTerm ? `"${activeTerm.name}"` : 'the current active term'}. Only one term can
              be active at a time. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSetActive}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
