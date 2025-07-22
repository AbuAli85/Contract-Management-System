import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { i18n } from '@/src/i18n/i18n-config'

export async function middleware(req: NextRequest) {
  // Skip static assets and API routes for performance
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/static') ||
    req.nextUrl.pathname.startsWith('/api/') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Handle old logout routes - redirect to proper logout
  if (req.nextUrl.pathname.includes('/logout')) {
    const url = req.nextUrl.clone()
    url.pathname = '/api/auth/logout'
    return NextResponse.redirect(url)
  }

  // Handle page routes with locale - optimized to reduce redirects
  const pathParts = req.nextUrl.pathname.split('/')
  const maybeLocale = pathParts[1]
  const hasLocale = i18n.locales.includes(maybeLocale)
  const locale = hasLocale ? maybeLocale : i18n.defaultLocale

  // Handle root path - redirect to locale dashboard
  if (req.nextUrl.pathname === '/') {
    const url = req.nextUrl.clone()
    url.pathname = `/${locale}/dashboard`
    return NextResponse.redirect(url)
  }

  // Handle login path without locale - redirect to locale-specific login
  if (req.nextUrl.pathname === '/login') {
    const url = req.nextUrl.clone()
    url.pathname = `/${locale}/login`
    return NextResponse.redirect(url)
  }

  // Add locale prefix if missing (except for root and login paths)
  if (!hasLocale && req.nextUrl.pathname !== '/' && req.nextUrl.pathname !== '/login') {
    const url = req.nextUrl.clone()
    url.pathname = `/${locale}${req.nextUrl.pathname}`
    return NextResponse.redirect(url)
  }

  // Handle locale-only path (e.g., /en) - redirect to dashboard
  if (hasLocale && pathParts.length === 2) {
    const url = req.nextUrl.clone()
    url.pathname = `/${locale}/dashboard`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Configure middleware matching - exclude API routes
export const config = {
  matcher: [
    // Include page routes, exclude API routes and static files
    '/((?!_next|static|api|.*\\..*).*)',
  ],
}
