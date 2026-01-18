'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Home,
  Users,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  ClipboardList,
  AlertTriangle,
  Edit,
  TrendingUp,
  LogOut,
  Upload,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { logout } from '@/app/auth/actions'

interface SidebarProps {
  role: 'admin' | 'teacher'
  userInitials: string
  fullName: string
  email: string
}

export function Sidebar({ role, userInitials, fullName, email }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status')

  const adminItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/students/directory', icon: GraduationCap, label: 'Student Directory' },
    { href: '/admin/classes', icon: School, label: 'Classes' },
    { href: '/admin/curriculum', icon: BookOpen, label: 'Curriculum' },
    { href: '/admin/terms', icon: Calendar, label: 'Terms' },
    { href: '/admin/flags', icon: AlertTriangle, label: 'Flags' },
  ]

  const teacherItems = [
    { href: '/teacher/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/teacher/students', icon: Users, label: 'My Students' },
    { href: '/teacher/classes', icon: School, label: 'My Classes' },
    { href: '/teacher/grades/entry', icon: Edit, label: 'Enter Grades' },
    { href: '/teacher/grades', icon: ClipboardList, label: 'View Grades' },
    { href: '/teacher/progress', icon: TrendingUp, label: 'Student Progress' },
    { href: '/teacher/progress?status=flagged', icon: AlertTriangle, label: 'Flagged Students' },
  ]

  const items = role === 'admin' ? adminItems : teacherItems

  const handleLogout = async () => {
    await logout()
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-blue-900 flex flex-col z-50 border-r border-blue-800">
      {/* Logo Section */}
      <div className="h-20 flex items-center justify-center border-b border-blue-800 shrink-0">
        <div className="flex items-center justify-center p-2">
          <div className="rounded-full bg-white p-2 flex items-center justify-center">
            <Image
              src="/favicon and mini sidebar logo.png"
              alt="Improve ME Institute Logo"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
          <div className="space-y-1">
            {items.map((item) => {
              const [hrefPath, hrefQuery] = item.href.split('?')
              const currentQuery = searchParams.toString()
              
              let isActive = false
              if (hrefQuery) {
                // Match items with query params exactly
                isActive = pathname === hrefPath && currentQuery === hrefQuery
              } else {
                // Match items without query params
                if (currentQuery) {
                  // If URL has query, this item is only active if it matches path 
                  // AND there isn't a more specific item for this query
                  const hasMoreSpecificItem = items.some(i => i.href === `${pathname}?${currentQuery}`)
                  isActive = pathname === hrefPath && !hasMoreSpecificItem
                } else {
                  // Standard matching, but handle the grades/entry overlap
                  if (item.href === '/teacher/grades') {
                    isActive = pathname === '/teacher/grades'
                  } else {
                    isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  }
                }
              }

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-center h-14 w-full transition-all duration-200 relative group',
                        isActive
                          ? 'bg-blue-800 text-white'
                          : 'text-blue-100/70 hover:bg-blue-800/50 hover:text-white',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-110',
                          isActive ? 'text-white' : '',
                        )}
                      />

                      {/* Active indicator - left border */}
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="mt-auto border-t border-blue-800 p-4 space-y-4 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center cursor-default">
                <Avatar className="h-10 w-10 border-2 border-blue-700 shadow-sm">
                  <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="flex flex-col gap-0.5">
              <p className="font-bold">{fullName}</p>
              <p className="text-xs text-blue-100/60 capitalize">{role}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center h-10 w-full text-blue-100/70 hover:text-white hover:bg-blue-800/50 transition-colors rounded-lg"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Logout
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </aside>
  )
}
