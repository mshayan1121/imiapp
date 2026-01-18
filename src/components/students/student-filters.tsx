'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X } from 'lucide-react'
import { StudentDirectoryFilters } from '@/types/students'

interface StudentFiltersProps {
  filters: StudentDirectoryFilters
  onFilterChange: (filters: StudentDirectoryFilters) => void
  onClearFilters: () => void
  availableSchools: string[]
  availableClasses: Array<{ id: string; name: string }>
  availableYearGroups: string[]
  role: 'admin' | 'teacher'
}

export function StudentFilters({
  filters,
  onFilterChange,
  onClearFilters,
  availableSchools,
  availableClasses,
  availableYearGroups,
  role,
}: StudentFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search)

  useEffect(() => {
    setLocalSearch(filters.search)
  }, [filters.search])

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    onFilterChange({ ...filters, search: value })
  }

  const updateFilter = (key: keyof StudentDirectoryFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                role === 'admin'
                  ? 'Search by name, year group, or school...'
                  : 'Search by student name...'
              }
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Select
            value={filters.year_group || 'all'}
            onValueChange={(v) => updateFilter('year_group', v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Year Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYearGroups.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {role === 'admin' && (
            <Select
              value={filters.school || 'all'}
              onValueChange={(v) => updateFilter('school', v === 'all' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="School" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {availableSchools.map((school) => (
                  <SelectItem key={school} value={school}>
                    {school}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={filters.class_id || 'all'}
            onValueChange={(v) => updateFilter('class_id', v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {role === 'admin' ? 'All Classes' : 'All My Classes'}
              </SelectItem>
              {availableClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {role === 'admin' && (
            <Select
              value={filters.enrollment_status || 'all'}
              onValueChange={(v) => updateFilter('enrollment_status', v === 'all' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Enrollment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="not_enrolled">Not Enrolled</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select
            value={filters.performance || 'all'}
            onValueChange={(v) => updateFilter('performance', v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Performance</SelectItem>
              <SelectItem value="on_track">On Track (≥80%)</SelectItem>
              <SelectItem value="at_risk">At Risk (70-80%)</SelectItem>
              <SelectItem value="struggling">Struggling (&lt;70%)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.flag_status || 'all'}
            onValueChange={(v) => updateFilter('flag_status', v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Flags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Flags</SelectItem>
              <SelectItem value="none">No Flags</SelectItem>
              <SelectItem value="1">1 Flag</SelectItem>
              <SelectItem value="2">2 Flags</SelectItem>
              <SelectItem value="3">3 Flags</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
