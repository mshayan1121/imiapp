'use client'

import * as React from 'react'
import { SidebarProvider } from './sidebar-context'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  children: React.ReactNode
  sidebar: React.ReactNode
}

function DashboardContent({ children, sidebar }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {sidebar}
      <main className="flex-1 min-h-screen ml-20">{children}</main>
    </div>
  )
}

export function DashboardShell({ children, sidebar }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <DashboardContent sidebar={sidebar}>{children}</DashboardContent>
    </SidebarProvider>
  )
}
