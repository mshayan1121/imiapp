import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminAuthForm } from '@/components/auth/admin-auth-form'
import { TeacherAuthForm } from '@/components/auth/teacher-auth-form'
import { GraduationCap } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-6">
      <div className="w-full max-w-[450px]">
        <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mx-auto bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">IMI System</h1>
          <p className="text-gray-600 mt-2 font-medium">Institute Management & Insights</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-50 p-1 rounded-xl">
              <TabsTrigger
                value="admin"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-semibold"
              >
                Admin
              </TabsTrigger>
              <TabsTrigger
                value="teacher"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-semibold"
              >
                Teacher
              </TabsTrigger>
            </TabsList>
            <TabsContent value="admin" className="mt-0">
              <AdminAuthForm />
            </TabsContent>
            <TabsContent value="teacher" className="mt-0">
              <TeacherAuthForm />
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Secure access for authorized personnel only.
        </p>
      </div>
    </div>
  )
}
