import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Get session with reasonable timeout for slow database connections
    const sessionPromise = supabase.auth.getSession()
    const { data: { session } } = await Promise.race([
      sessionPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 2000) // Reduced to 2 seconds
      )
    ]) as any

    // Extract locale from pathname
    const pathname = req.nextUrl.pathname
    const pathnameIsMissingLocale = ['en', 'ar'].every(
      (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    )

    // Default locale
    const locale = 'en'

    // Redirect if there is no locale
    if (pathnameIsMissingLocale) {
      const url = req.nextUrl.clone()
      url.pathname = `/${locale}${pathname}`
      return NextResponse.redirect(url)
    }

    // Extract locale from pathname
    const pathLocale = pathname.split('/')[1]
    const validLocales = ['en', 'ar']
    const currentLocale = validLocales.includes(pathLocale) ? pathLocale : 'en'

    // Define public routes that don't require authentication
    const publicRoutes = [
      `/${currentLocale}/auth/login`,
      `/${currentLocale}/auth/signup`,
      `/${currentLocale}/auth/forgot-password`,
      `/${currentLocale}/auth/reset-password`,
      `/${currentLocale}/auth/callback`
    ]

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // If not authenticated and trying to access protected route, redirect to login
    if (!session && !isPublicRoute) {
      console.log('🔒 Middleware: No session, redirecting to login from:', pathname)
      const url = req.nextUrl.clone()
      url.pathname = `/${currentLocale}/auth/login`
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Handle root path - redirect to locale dashboard (if authenticated) or login
    if (req.nextUrl.pathname === '/') {
      const url = req.nextUrl.clone()
      if (session) {
        console.log('🔒 Middleware: Root path, authenticated user, redirecting to dashboard')
        url.pathname = `/${currentLocale}/dashboard`
      } else {
        console.log('🔒 Middleware: Root path, unauthenticated user, redirecting to login')
        url.pathname = `/${currentLocale}/auth/login`
      }
      return NextResponse.redirect(url)
    }

    return res
  } catch (error) {
    console.error('🔒 Middleware error:', error)
    // On error, allow the request to continue but log the issue
    // This prevents the app from being completely broken due to slow database
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
