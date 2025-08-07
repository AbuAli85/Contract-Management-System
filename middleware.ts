import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createMiddleware from "next-intl/middleware"

// Emergency middleware with enhanced error handling
const intlMiddleware = createMiddleware({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true
})

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Enhanced API route skipping with emergency patterns
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/test-filename") ||
    pathname.includes(".") ||
    pathname.includes("/.well-known/") ||
    pathname.includes("?_rsc=") ||
    pathname.includes("?rsc=") ||
    pathname.includes("/static/") ||
    pathname.includes("/images/") ||
    pathname.includes("/fonts/") ||
    // Emergency patterns
    pathname.includes("/emergency/") ||
    pathname.includes("/debug/") ||
    pathname.includes("/health")
  ) {
    // Apply security headers for API routes
    const response = NextResponse.next()
    
    // Security Headers
    if (process.env.SECURITY_HEADERS_ENABLED === 'true') {
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    }

    // XSS Protection
    if (process.env.ENABLE_XSS_PROTECTION === 'true') {
      response.headers.set('X-XSS-Protection', '1; mode=block')
    }

    // CORS Headers for API routes
    if (pathname.startsWith('/api/')) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
      const origin = request.headers.get('origin')
      
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
      
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    // Request logging
    if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
      console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`)
    }

    return response
  }

  // Handle root path redirect with error handling
  if (pathname === "/") {
    try {
      return NextResponse.redirect(new URL("/en", request.url))
    } catch (error) {
      console.error("Emergency middleware redirect error:", error)
      return NextResponse.next()
    }
  }

  // Apply i18n middleware with comprehensive error handling
  try {
    const response = intlMiddleware(request)
    if (response) {
      // Add security headers to page responses
      if (process.env.SECURITY_HEADERS_ENABLED === 'true') {
        response.headers.set('X-Frame-Options', 'DENY')
        response.headers.set('X-Content-Type-Options', 'nosniff')
        response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
        response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
      }

      // XSS Protection
      if (process.env.ENABLE_XSS_PROTECTION === 'true') {
        response.headers.set('X-XSS-Protection', '1; mode=block')
      }

      // Content Security Policy
      if (process.env.ENABLE_CONTENT_SECURITY_POLICY === 'true') {
        const csp = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: https: blob:",
          "font-src 'self' https: data: https://fonts.gstatic.com",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live https://fonts.googleapis.com https://fonts.gstatic.com",
          "frame-ancestors 'none'",
          "object-src 'none'",
          "base-uri 'self'",
        ].join('; ')
        response.headers.set('Content-Security-Policy', csp)
      }

      return response
    }
    // Fallback redirect
    const fallbackResponse = NextResponse.redirect(new URL("/en", request.url))
    
    // Add security headers to fallback response
    if (process.env.SECURITY_HEADERS_ENABLED === 'true') {
      fallbackResponse.headers.set('X-Frame-Options', 'DENY')
      fallbackResponse.headers.set('X-Content-Type-Options', 'nosniff')
      fallbackResponse.headers.set('Referrer-Policy', 'origin-when-cross-origin')
      fallbackResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    }
    
    return fallbackResponse
  } catch (error) {
    console.error("Emergency middleware i18n error:", error)
    // Ultimate fallback - just continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api routes
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - Emergency routes
    "/((?!api|_next/static|_next/image|favicon.ico|emergency|debug|health).*)",
  ],
}