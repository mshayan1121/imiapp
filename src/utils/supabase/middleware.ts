import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const role = user?.user_metadata?.role

  // Admin Protection
  if (path.startsWith('/admin')) {
    if (!user || role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Teacher Protection
  if (path.startsWith('/teacher')) {
    if (!user || role !== 'teacher') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from root page (login)
  if (user && path === '/') {
    if (role === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
    if (role === 'teacher') {
      const url = request.nextUrl.clone()
      url.pathname = '/teacher/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Log middleware performance
  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const duration = endTime - startTime
  if (duration > 50) {
    console.log(`⚠️ [PERF] Middleware: ${path} - ${duration.toFixed(2)}ms`)
  }

  return supabaseResponse
}
