import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
// @ts-ignore
import createMiddleware from "next-intl/middleware"

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 100, // requests per window
  windowMs: 15 * 60 * 1000, // 15 minutes
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
}

// Special rate limiting for auth endpoints
const AUTH_RATE_LIMIT_CONFIG = {
  maxRequests: 1000, // Higher limit for auth checks
  windowMs: 15 * 60 * 1000, // 15 minutes
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting function
function checkRateLimit(identifier: string, isAuthEndpoint: boolean = false): boolean {
  const config = isAuthEndpoint ? AUTH_RATE_LIMIT_CONFIG : RATE_LIMIT_CONFIG
  const now = Date.now()
  const windowStart = now - config.windowMs

  // Clean up old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < windowStart) {
      rateLimitStore.delete(key)
    }
  }

  const current = rateLimitStore.get(identifier)

  if (!current || current.resetTime < windowStart) {
    // First request in this window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now,
    })
    return true
  }

  if (current.count >= config.maxRequests) {
    return false
  }

  // Increment count
  current.count++
  return true
}

// Get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  // Use IP address as primary identifier
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

  // For API routes, also consider the user agent and path
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const userAgent = request.headers.get("user-agent") || "unknown"
    const path = request.nextUrl.pathname
    return `${ip}:${userAgent}:${path}`
  }

  return ip
}

// Security headers configuration
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.supabase.com wss://*.supabase.co; frame-src 'self' https://vercel.live; object-src 'self' data:; base-uri 'self'; form-action 'self';",
}

// Create next-intl middleware
const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ["en", "ar"],

  // Used when no locale matches
  defaultLocale: "en",

  // Domains can be used to configure locale-specific domains
  // domains: [
  //   {
  //     domain: 'example.com',
  //     defaultLocale: 'en',
  //   },
  //   {
  //     domain: 'example.ar',
  //     defaultLocale: 'ar',
  //   },
  // ],
})

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const fullPath = pathname + search

  // Check if this is an RSC request
  const isRSCRequest = search.includes("?_rsc=") || search.includes("?rsc=")

  // Skip i18n middleware for API routes, auth routes, RSC requests, and other non-page routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".") || // Static files
    isRSCRequest // React Server Component requests
  ) {
    // Apply only security and rate limiting for these routes
    const response = NextResponse.next()

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    response.headers.set("X-Request-ID", requestId)

    // Rate limiting for API routes and sensitive endpoints
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/auth/") ||
      pathname.includes("login") ||
      pathname.includes("signup")
    ) {
      const identifier = getClientIdentifier(request)
      const isAuthEndpoint = pathname.includes("/api/auth/") || pathname.includes("/auth/")
      const config = isAuthEndpoint ? AUTH_RATE_LIMIT_CONFIG : RATE_LIMIT_CONFIG

      if (!checkRateLimit(identifier, isAuthEndpoint)) {
        console.warn(`Rate limit exceeded for ${identifier}`)

        return new NextResponse(
          JSON.stringify({
            error: "Too many requests",
            message: "Rate limit exceeded. Please try again later.",
            retryAfter: Math.ceil(config.windowMs / 1000),
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": Math.ceil(config.windowMs / 1000).toString(),
              "X-RateLimit-Limit": config.maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": (Date.now() + config.windowMs).toString(),
              ...securityHeaders,
            },
          },
        )
      }

      // Add rate limit headers to successful responses
      const current = rateLimitStore.get(identifier)
      if (current) {
        response.headers.set("X-RateLimit-Limit", config.maxRequests.toString())
        response.headers.set(
          "X-RateLimit-Remaining",
          (config.maxRequests - current.count).toString(),
        )
        response.headers.set(
          "X-RateLimit-Reset",
          (current.resetTime + config.windowMs).toString(),
        )
      }
    }

    // Special handling for Supabase-related routes
    if (pathname.startsWith("/api/supabase/") || pathname.includes("supabase")) {
      // Add CORS headers for Supabase requests
      response.headers.set("Access-Control-Allow-Origin", "*")
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Client-Info",
      )

      // Add Supabase-specific headers
      response.headers.set("X-Supabase-Client", "contract-management-system/1.0")
    }

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info",
          ...securityHeaders,
        },
      })
    }

    // Log important requests for debugging (skip repetitive auth checks)
    if (process.env.NODE_ENV === "development" && !pathname.includes("/api/auth/check-session")) {
      console.log(
        `🔧 Middleware: ${request.method} ${fullPath} - ${requestId} ${isRSCRequest ? "(RSC)" : ""}`,
      )
    } else if (process.env.NODE_ENV === "development" && pathname.includes("/api/auth/check-session")) {
      // Log auth checks less frequently to reduce noise
      const shouldLog = Math.random() < 0.1 // Only log 10% of auth checks
      if (shouldLog) {
        console.log(`🔧 Middleware: ${request.method} ${fullPath} - ${requestId} (AUTH CHECK - 10% sample)`)
      }
    }

    return response
  }

  // Handle i18n routing for page routes
  const intlResponse = intlMiddleware(request)

  // If the intl middleware returns a response, apply our custom headers and return
  if (intlResponse) {
    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      intlResponse.headers.set(key, value)
    })

    // Add request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    intlResponse.headers.set("X-Request-ID", requestId)

    return intlResponse
  }

  // For non-i18n routes, continue with our custom middleware
  const response = NextResponse.next()

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  response.headers.set("X-Request-ID", requestId)

  // Log important requests for debugging (skip repetitive auth checks)
  if (process.env.NODE_ENV === "development" && !pathname.includes("/api/auth/check-session")) {
    console.log(`🔧 Middleware: ${request.method} ${fullPath} - ${requestId}`)
  } else if (process.env.NODE_ENV === "development" && pathname.includes("/api/auth/check-session")) {
    // Log auth checks less frequently to reduce noise
    const shouldLog = Math.random() < 0.1 // Only log 10% of auth checks
    if (shouldLog) {
      console.log(`🔧 Middleware: ${request.method} ${fullPath} - ${requestId} (AUTH CHECK - 10% sample)`)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
