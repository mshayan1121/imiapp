'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, GraduationCap, FileText, BookOpen, Book, FileEdit, Star, Plus, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CurriculumItem, CurriculumLevel } from './types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TreeItemProps {
  item: CurriculumItem
  level: number
  isSelected: boolean
  isExpanded: boolean
  onSelect: (item: CurriculumItem) => void
  onToggle: (id: string) => void
  onAdd: (level: CurriculumLevel, parentId: string) => void
  onEdit: (item: CurriculumItem) => void
  onDelete: (item: CurriculumItem) => void
  onAddCourse?: (subject: CurriculumItem) => void
  children?: React.ReactNode
}

const levelIcons = {
  qualification: GraduationCap,
  board: FileText,
  subject: BookOpen,
  topic: Book,
  subtopic: FileEdit,
}

export function TreeItem({
  item,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  onAddCourse,
  children,
}: TreeItemProps) {
  const Icon = levelIcons[item.level]
  const hasChildren = item.children && item.children.length > 0
  const childrenCount = item.children?.length || 0

  const getNextLevel = (level: CurriculumLevel): CurriculumLevel | null => {
    switch (level) {
      case 'qualification': return 'board'
      case 'board': return 'subject'
      case 'subject': return 'topic'
      case 'topic': return 'subtopic'
      default: return null
    }
  }

  const nextLevel = getNextLevel(item.level)

  return (
    <div className="w-full">
      <div
        className={cn(
          'group flex items-center gap-2 py-2 px-3 cursor-pointer transition-all duration-200 rounded-lg mb-1 border border-transparent',
          isSelected
            ? 'bg-blue-50 text-blue-900 border-blue-100 shadow-sm'
            : 'hover:bg-gray-50 hover:border-gray-200 text-gray-700'
        )}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => onToggle(item.id)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            onClick={(e) => {
              e.stopPropagation()
              onToggle(item.id)
            }}
            className={cn(
              'p-1 hover:bg-gray-200 rounded-md transition-colors',
              !hasChildren && 'opacity-0 cursor-default pointer-events-none'
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </div>

          <div className={cn(
            "p-1.5 rounded-md",
            item.level === 'qualification' ? "bg-purple-100 text-purple-600" :
            item.level === 'board' ? "bg-blue-100 text-blue-600" :
            item.level === 'subject' ? "bg-green-100 text-green-600" :
            item.level === 'topic' ? "bg-orange-100 text-orange-600" :
            "bg-gray-100 text-gray-600"
          )}>
            <Icon className="h-4 w-4 shrink-0" />
          </div>
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="truncate text-sm font-medium">{item.name}</span>
            {hasChildren && (
              <span className="text-[10px] text-gray-400 font-normal shrink-0">
                ({childrenCount})
              </span>
            )}
            {item.has_course && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Course exists for this subject</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto pl-4">
            {nextLevel && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd(nextLevel, item.id)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add {nextLevel.charAt(0).toUpperCase() + nextLevel.slice(1)}
              </Button>
            )}
            
            {item.level === 'subject' && !item.has_course && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 gap-1.5 font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddCourse?.(item)
                }}
              >
                <Star className="h-3.5 w-3.5" />
                Create Course
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(item)
              }}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(item)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
      {isExpanded && hasChildren && <div className="mt-1">{children}</div>}
    </div>
  )
}
