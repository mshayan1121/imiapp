'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Download, ChevronRight, Users, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ClassData {
  id: string
  name: string
  teacher: string
  studentCount: number
  gradesEntered: number
  avgPercentage: number
  lpCount: number
  flagCount: number
}

interface ClassPerformanceTableProps {
  data: ClassData[]
}

export function ClassPerformanceTable({ data }: ClassPerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = data.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const exportToCSV = () => {
    const headers = ['Class Name', 'Teacher', 'Students', 'Grades Entered', 'Avg %', 'LP Count', 'Flag Count']
    const csvData = filteredData.map((cls) => [
      cls.name,
      cls.teacher,
      cls.studentCount,
      cls.gradesEntered,
      `${cls.avgPercentage}%`,
      cls.lpCount,
      cls.flagCount,
    ])

    const csvContent = [headers, ...csvData].map((e) => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `class_performance_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Class Performance Breakdown</CardTitle>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search class or teacher..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="h-9 font-bold">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Class Name</TableHead>
                <TableHead className="font-bold">Teacher</TableHead>
                <TableHead className="font-bold text-center">Students</TableHead>
                <TableHead className="font-bold text-center">Grades</TableHead>
                <TableHead className="font-bold text-center">Average %</TableHead>
                <TableHead className="font-bold text-center">LP Count</TableHead>
                <TableHead className="font-bold text-center">Flag Count</TableHead>
                <TableHead className="text-right font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No classes found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((cls) => (
                  <TableRow key={cls.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-slate-900">{cls.name}</TableCell>
                    <TableCell className="font-medium text-slate-600">{cls.teacher}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-bold bg-slate-100 border-none">
                        {cls.studentCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium">{cls.gradesEntered}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'font-black px-2 py-1 rounded text-sm',
                          cls.avgPercentage < 70
                            ? 'bg-red-100 text-red-700'
                            : cls.avgPercentage < 80
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700',
                        )}
                      >
                        {cls.avgPercentage}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'font-bold',
                          cls.lpCount > 0 ? 'text-amber-600' : 'text-slate-400',
                        )}
                      >
                        {cls.lpCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'font-bold',
                          cls.flagCount > 0 ? 'text-red-600' : 'text-slate-400',
                        )}
                      >
                        {cls.flagCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/classes/${cls.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
