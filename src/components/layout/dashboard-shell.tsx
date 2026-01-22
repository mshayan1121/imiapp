'use client'

import * as React from 'react'
import { SidebarProvider, useSidebar } from './sidebar-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { useDialogOpen } from '@/hooks/use-dialog-open'

interface DashboardShellProps {
  children: React.ReactNode
  sidebar: React.ReactNode
}

function DashboardContent({ children, sidebar }: DashboardShellProps) {
  const { isOpen, setIsOpen, toggle } = useSidebar()
  const isDialogOpen = useDialogOpen()

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile hamburger menu button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'fixed top-4 left-4 z-50 md:hidden h-11 w-11 bg-white shadow-md hover:bg-gray-100',
          'min-h-[44px] min-w-[44px]'
        )}
        onClick={toggle}
        aria-label="Toggle menu"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-screen z-50 transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebar}
      </div>

      {/* Main content */}
      <main
        className={cn(
          'flex-1 min-h-screen transition-all duration-300 w-full',
          'md:ml-20'
        )}
        {...(isDialogOpen && { inert: true })}
      >
        {children}
      </main>
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
