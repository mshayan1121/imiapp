import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Only match protected routes:
     * - /admin/* (admin routes)
     * - /teacher/* (teacher routes)
     * - / (root for redirect logic)
     * Exclude:
     * - _next/static, _next/image (Next.js internals)
     * - api routes
     * - static files (images, fonts, etc.)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}
