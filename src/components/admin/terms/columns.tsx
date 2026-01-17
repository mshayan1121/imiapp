'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2, CheckCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'

export type Term = {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  academic_year: string
  created_at: string
}

type ColumnsProps = {
  onEdit: (term: Term) => void
  onDelete: (term: Term) => void
  onSetActive: (term: Term) => void
}

export const getColumns = ({ onEdit, onDelete, onSetActive }: ColumnsProps): ColumnDef<Term>[] => [
  {
    accessorKey: 'name',
    header: 'Term Name',
  },
  {
    accessorKey: 'academic_year',
    header: 'Academic Year',
  },
  {
    accessorKey: 'start_date',
    header: 'Start Date',
    cell: ({ row }) => format(new Date(row.getValue('start_date')), 'PP'),
  },
  {
    accessorKey: 'end_date',
    header: 'End Date',
    cell: ({ row }) => format(new Date(row.getValue('end_date')), 'PP'),
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean
      return (
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className={isActive ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const term = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(term)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {!term.is_active && (
              <DropdownMenuItem onClick={() => onSetActive(term)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Set as Active
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(term)}
              className="text-red-600"
              disabled={term.is_active}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
