'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { getClassStudents } from '../actions'
import { getCourseContent, getSubtopics } from '../../grades/entry/actions'
import { FilterX } from 'lucide-react'

interface GradeFiltersProps {
  filters: any
  setFilters: (filters: any) => void
  terms: any[]
  classes: any[]
}

export function GradeFilters({ filters, setFilters, terms, classes }: GradeFiltersProps) {
  const [students, setStudents] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [subtopics, setSubtopics] = useState<any[]>([])

  // Load students when class changes
  useEffect(() => {
    if (filters.class_id) {
      getClassStudents(filters.class_id).then(setStudents)
    } else {
      setStudents([])
      setFilters({ ...filters, student_id: '' })
    }
  }, [filters.class_id])

  // Load topics when class changes (assuming class has one course)
  useEffect(() => {
    if (filters.class_id) {
      // In a real app, you'd get the course_id from the class object
      // For now, we'll need to fetch class details or have it in the classes array
    }
  }, [filters.class_id])

  const clearFilters = () => {
    const activeTerm = terms.find((t) => t.is_active) || terms[0]
    setFilters({
      class_id: '',
      term_id: activeTerm?.id || '',
      student_id: '',
      work_type: 'all',
      topic_id: '',
      subtopic_id: '',
    })
  }

  return (
    <Card className="border-none shadow-none bg-accent/30">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Class
            </label>
            <Select
              value={filters.class_id}
              onValueChange={(v) => setFilters({ ...filters, class_id: v, student_id: '' })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Term
            </label>
            <Select
              value={filters.term_id}
              onValueChange={(v) => setFilters({ ...filters, term_id: v })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select Term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Student
            </label>
            <Select
              value={filters.student_id}
              onValueChange={(v) => setFilters({ ...filters, student_id: v })}
              disabled={!filters.class_id}
            >
              <SelectTrigger className="bg-background">
                <SelectValue
                  placeholder={filters.class_id ? 'All Students' : 'Select Class First'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Work Type
            </label>
            <Select
              value={filters.work_type}
              onValueChange={(v) => setFilters({ ...filters, work_type: v })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="classwork">Classwork</SelectItem>
                <SelectItem value="homework">Homework</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2 flex items-end gap-2">
            <Button variant="outline" className="flex-1 bg-background" onClick={clearFilters}>
              <FilterX className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
