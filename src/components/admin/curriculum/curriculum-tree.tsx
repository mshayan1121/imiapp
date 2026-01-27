'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, ChevronDown, ChevronRight, GraduationCap, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TreeItem } from './tree-item'
import { CurriculumItem, CurriculumLevel } from './types'
import { Card } from '@/components/ui/card'

interface CurriculumTreeProps {
  qualifications: any[]
  boards: any[]
  subjects: any[]
  topics: any[]
  subtopics: any[]
  courses: any[]
  onAdd: (level: CurriculumLevel, parentId?: string) => void
  onEdit: (item: CurriculumItem) => void
  onDelete: (item: CurriculumItem) => void
}

export function CurriculumTree({
  qualifications,
  boards,
  subjects,
  topics,
  subtopics,
  courses,
  onAdd,
  onEdit,
  onDelete,
}: CurriculumTreeProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const isManualExpandingRef = useRef(false)

  // Transform flat data into recursive structure
  const treeData = useMemo(() => {
    const buildTree = (): CurriculumItem[] => {
      return qualifications.map((q) => {
        const qBoards = boards
          .filter((b) => b.qualification_id === q.id)
          .map((b) => {
            const bSubjects = subjects
              .filter((s) => s.board_id === b.id)
              .map((s) => {
                const sTopics = topics
                  .filter((t) => t.subject_id === s.id)
                  .map((t) => {
                    const tSubtopics = subtopics
                      .filter((st) => st.topic_id === t.id)
                      .map((st) => ({
                        id: st.id,
                        name: st.name,
                        created_at: st.created_at,
                        level: 'subtopic' as CurriculumLevel,
                        parentId: t.id,
                      }))
                    return {
                      id: t.id,
                      name: t.name,
                      created_at: t.created_at,
                      level: 'topic' as CurriculumLevel,
                      parentId: s.id,
                      children: tSubtopics,
                    }
                  })
                return {
                  id: s.id,
                  name: s.name,
                  created_at: s.created_at,
                  level: 'subject' as CurriculumLevel,
                  parentId: b.id,
                  children: sTopics,
                  has_course: courses.some((c) => c.subject_id === s.id),
                }
              })
            return {
              id: b.id,
              name: b.name,
              created_at: b.created_at,
              level: 'board' as CurriculumLevel,
              parentId: q.id,
              children: bSubjects,
            }
          })
        return {
          id: q.id,
          name: q.name,
          created_at: q.created_at,
          level: 'qualification' as CurriculumLevel,
          children: qBoards,
        }
      })
    }

    return buildTree()
  }, [qualifications, boards, subjects, topics, subtopics, courses])

  // Filter tree based on search term
  const filteredTree = useMemo(() => {
    if (!searchTerm) return treeData

    const filterNodes = (nodes: CurriculumItem[]): CurriculumItem[] => {
      return nodes.reduce<CurriculumItem[]>((acc, node) => {
        const matchingChildren = node.children ? filterNodes(node.children) : []
        const isMatch = node.name.toLowerCase().includes(searchTerm.toLowerCase())

        if (isMatch || matchingChildren.length > 0) {
          acc.push({ ...node, children: matchingChildren })
        }
        return acc
      }, [])
    }

    return filterNodes(treeData)
  }, [treeData, searchTerm])

  // Auto-expand on search
  useEffect(() => {
    if (searchTerm && !isManualExpandingRef.current) {
      const newExpanded: string[] = []
      const addExpanded = (nodes: CurriculumItem[]) => {
        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            newExpanded.push(node.id)
            addExpanded(node.children)
          }
        })
      }
      addExpanded(filteredTree)
      setExpandedIds([...newExpanded])
    }
  }, [searchTerm, filteredTree])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((expandedId) => expandedId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const expandAll = () => {
    isManualExpandingRef.current = true
    const allIds: string[] = []
    const addAll = (nodes: CurriculumItem[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          allIds.push(node.id)
          addAll(node.children)
        }
      })
    }
    // Always expand all nodes from the full treeData
    addAll(treeData)
    // Set the expanded IDs array
    setExpandedIds([...allIds])
    // Reset the flag after state update completes
    setTimeout(() => {
      isManualExpandingRef.current = false
    }, 200)
  }

  const collapseAll = () => {
    setExpandedIds([])
  }

  const renderTree = (nodes: CurriculumItem[], level = 0) => {
    return nodes.map((node) => (
      <TreeItem
        key={node.id}
        item={node}
        level={level}
        isSelected={false}
        isExpanded={expandedIds.includes(node.id)}
        onSelect={() => {}}
        onToggle={toggleExpand}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
      >
        {node.children && renderTree(node.children, level + 1)}
      </TreeItem>
    ))
  }

  return (
    <div className="w-full space-y-6 relative pb-24">
      <Card className="p-6 shadow-sm border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search curriculum structure..."
              className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 text-sm font-medium hover:bg-gray-50"
              onClick={expandAll}
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 text-sm font-medium hover:bg-gray-50"
              onClick={collapseAll}
            >
              Collapse All
            </Button>
          </div>
        </div>

        <div className="min-h-[400px]">
          {filteredTree.length > 0 ? (
            <div className="space-y-1">
              {renderTree(filteredTree)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Search className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No results found for "{searchTerm}"</p>
              <Button 
                variant="link" 
                className="text-blue-600 mt-2"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Button
        size="lg"
        className="fixed bottom-8 right-8 h-14 px-6 rounded-full shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all gap-2 bg-blue-600 hover:bg-blue-700 text-white z-50"
        onClick={() => onAdd('qualification')}
      >
        <Plus className="h-6 w-6" />
        <span className="font-semibold">Add Qualification</span>
      </Button>
    </div>
  )
}
