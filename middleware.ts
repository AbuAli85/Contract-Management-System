import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Get pathname first
  const pathname = req.nextUrl.pathname
  
  // Skip middleware for system requests
  const systemPaths = [
    '/.well-known',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
    '/favicon.ico'
  ]
  
  if (systemPaths.some(path => pathname.startsWith(path))) {
    return res
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            req.cookies.set({
              name,
              value,
              ...options,
            })
            res.cookies.set({
              name,
              value,
              ...options,
            })
          } catch {
            // The `set` method was called from middleware.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            req.cookies.set({
              name,
              value: '',
              ...options,
            })
            res.cookies.set({
              name,
              value: '',
              ...options,
            })
          } catch {
            // The `delete` method was called from middleware.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  try {
    // Get session with reasonable timeout for slow database connections
    console.log('🔒 Middleware: Checking session for path:', pathname)
    
    const sessionPromise = supabase.auth.getSession()
    const { data: { session }, error: sessionError } = await Promise.race([
      sessionPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 5000) // Increased to 5 seconds
      )
    ]) as any
    
    if (sessionError) {
      console.error('🔒 Middleware: Session error:', sessionError)
      // On session error, allow the request to continue but log it
      console.log('🔒 Middleware: Allowing request despite session error')
      return res
    }
    
    console.log('🔒 Middleware: Session result:', session ? `found for user ${session.user.id}` : 'not found')

    // Extract locale from pathname (pathname is already declared above)
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
      `/${currentLocale}/auth/callback`,
      `/${currentLocale}/auth/bypass`,
      `/${currentLocale}/demo`,
      `/${currentLocale}/onboarding`,
      `/${currentLocale}/test-auth`,
      `/${currentLocale}/test-auth-system`,
      `/${currentLocale}/test-user-signup`,
      `/${currentLocale}/debug-auth`,
      `/${currentLocale}/debug-promoter`
    ]

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // If not authenticated and trying to access protected route, redirect to login
    if (!session && !isPublicRoute) {
      // Only log for actual page requests, not system requests
      if (!pathname.includes('.well-known') && !pathname.includes('robots.txt') && !pathname.includes('sitemap.xml')) {
        console.log('🔒 Middleware: No session, redirecting to login from:', pathname)
      }
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
    console.log('🔒 Middleware: Allowing request despite error')
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
     * - .well-known (system files)
     * - robots.txt (SEO files)
     * - sitemap.xml (SEO files)
     * - manifest.json (PWA files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.well-known|robots.txt|sitemap.xml|manifest.json).*)',
  ],
}
