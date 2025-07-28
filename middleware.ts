import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/contracts',
  '/manage-promoters',
  '/manage-parties',
  '/profile',
  '/admin'
]

// Define auth routes that should redirect if user is already authenticated
const authRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password'
]

export async function middleware(request: NextRequest) {
  try {
    // Create Supabase client for middleware
    const supabase = createClient(request)
    
    // Get current user using getUser() for better security
    const { data: { user }, error } = await supabase.auth.getUser()
    
    const { pathname } = request.nextUrl
    
    // Handle root path redirect
    if (pathname === '/') {
      if (user) {
        // User is authenticated, redirect to dashboard
        return NextResponse.redirect(new URL('/en/dashboard', request.url))
      } else {
        // User is not authenticated, redirect to login
        return NextResponse.redirect(new URL('/en/auth/login', request.url))
      }
    }
    
    // Extract locale from pathname (e.g., /en/dashboard -> en)
    const pathSegments = pathname.split('/')
    const locale = pathSegments[1] && pathSegments[1].length === 2 ? pathSegments[1] : 'en'
    
    // Check if the path is a protected route (with or without locale)
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.includes(route) || pathname.includes(`/${locale}${route}`)
    )
    
    // Check if the path is an auth route (with or without locale)
    const isAuthRoute = authRoutes.some(route => 
      pathname.includes(route) || pathname.includes(`/${locale}${route}`)
    )
    
    // If accessing protected route without user, redirect to login
    if (isProtectedRoute && !user) {
      const loginUrl = new URL(`/${locale}/auth/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // If accessing auth route with user, allow the client-side redirect to handle it
    // Don't redirect in middleware to avoid conflicts
    if (isAuthRoute && user) {
      // Let the client-side logic handle the redirect
      return NextResponse.next()
    }
    
    // Continue with the request
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, continue with the request
    return NextResponse.next()
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
