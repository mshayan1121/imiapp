import { Card, CardContent } from '@/components/ui/card'
import {
  Users,
  Layers,
  GraduationCap,
  BookOpen,
  Calendar,
  Flag,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

const navItems = [
  { label: 'Manage Users', icon: Users, href: '/admin/users', color: 'bg-blue-100 text-blue-600' },
  {
    label: 'Manage Classes',
    icon: Layers,
    href: '/admin/classes',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    label: 'Student Directory',
    icon: GraduationCap,
    href: '/admin/students/directory',
    color: 'bg-green-100 text-green-600',
  },
  {
    label: 'Curriculum',
    icon: BookOpen,
    href: '/admin/curriculum',
    color: 'bg-amber-100 text-amber-600',
  },
  { label: 'Terms', icon: Calendar, href: '/admin/terms', color: 'bg-slate-100 text-slate-600' },
  { label: 'Flagged Students', icon: Flag, href: '/admin/flags', color: 'bg-red-100 text-red-600' },
  { label: 'Reports', icon: BarChart3, href: '/admin/reports', color: 'bg-pink-100 text-pink-600' },
]

export function QuickNavigation() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
      {navItems.map((item, i) => (
        <Link key={i} href={item.href}>
          <Card className="hover:border-blue-200 transition-all group cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div
                className={`p-3 rounded-xl mb-3 ${item.color} group-hover:scale-110 transition-transform`}
              >
                <item.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {item.label}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
