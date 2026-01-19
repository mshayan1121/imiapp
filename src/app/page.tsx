import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminAuthForm } from '@/components/auth/admin-auth-form'
import { TeacherAuthForm } from '@/components/auth/teacher-auth-form'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-6 lg:p-6">
      <div className="w-full max-w-[450px]">
        <div className="mb-4 sm:mb-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mx-auto mb-2 sm:mb-3 flex items-center justify-center w-full max-w-[80vw] sm:max-w-none">
            <Image
              src="/full logo.png"
              alt="Improve ME Institute Logo"
              width={192}
              height={192}
              className="object-contain w-auto h-auto max-h-24 sm:max-h-36 md:max-h-48 max-w-full"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight px-2">
            Improve ME Institute App
          </h1>
        </div>

        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 bg-gray-50 p-1 rounded-lg sm:rounded-xl h-auto">
              <TabsTrigger
                value="admin"
                className="rounded-md sm:rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-semibold text-sm sm:text-base py-2.5 sm:py-3 min-h-[44px]"
              >
                Admin
              </TabsTrigger>
              <TabsTrigger
                value="teacher"
                className="rounded-md sm:rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-semibold text-sm sm:text-base py-2.5 sm:py-3 min-h-[44px]"
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

        <p className="mt-4 sm:mt-5 text-center text-xs sm:text-sm text-gray-500 px-2">
          Secure access for authorized personnel only.
        </p>
      </div>
    </div>
  )
}
