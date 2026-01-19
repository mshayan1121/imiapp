'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { login } from '@/app/auth/actions'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export function TeacherAuthForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('email', values.email)
    formData.append('password', values.password)

    const result = await login(formData)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2 text-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Teacher Sign In</h2>
        <p className="text-xs sm:text-sm text-gray-500 px-2">
          Enter your credentials to access the teacher dashboard.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-700">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="teacher@example.com"
                      className="bg-gray-50/50 border-gray-200 focus:bg-white h-11 sm:h-12 min-h-[44px]"
                      {...field}
                    />
                  </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-gray-50/50 border-gray-200 focus:bg-white h-11 sm:h-12 min-h-[44px]"
                      {...field}
                    />
                  </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full h-11 sm:h-12 shadow-md shadow-primary/10 mt-2 min-h-[44px]"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>

      <div className="pt-4 text-center">
        <p className="text-xs sm:text-sm text-gray-500 px-2">Teachers are registered by administrators</p>
      </div>
    </div>
  )
}
