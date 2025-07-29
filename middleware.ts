import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 100, // requests per window
  windowMs: 15 * 60 * 1000, // 15 minutes
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting function
function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs
  
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
      resetTime: now
    })
    return true
  }
  
  if (current.count >= RATE_LIMIT_CONFIG.maxRequests) {
    return false
  }
  
  // Increment count
  current.count++
  return true
}

// Get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  // Use IP address as primary identifier
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // For API routes, also consider the user agent and path
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const path = request.nextUrl.pathname
    return `${ip}:${userAgent}:${path}`
  }
  
  return ip
}

// Security headers configuration
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.supabase.com wss://*.supabase.co; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';",
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  response.headers.set('X-Request-ID', requestId)
  
  // Rate limiting for API routes and sensitive endpoints
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/auth/') ||
      request.nextUrl.pathname.includes('login') ||
      request.nextUrl.pathname.includes('signup')) {
    
    const identifier = getClientIdentifier(request)
    
    if (!checkRateLimit(identifier)) {
      console.warn(`Rate limit exceeded for ${identifier}`)
      
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + RATE_LIMIT_CONFIG.windowMs).toString(),
            ...securityHeaders
          }
        }
      )
    }
    
    // Add rate limit headers to successful responses
    const current = rateLimitStore.get(identifier)
    if (current) {
      response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', (RATE_LIMIT_CONFIG.maxRequests - current.count).toString())
      response.headers.set('X-RateLimit-Reset', (current.resetTime + RATE_LIMIT_CONFIG.windowMs).toString())
    }
  }
  
  // Special handling for Supabase-related routes
  if (request.nextUrl.pathname.startsWith('/api/supabase/') ||
      request.nextUrl.pathname.includes('supabase')) {
    
    // Add CORS headers for Supabase requests
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info')
    
    // Add Supabase-specific headers
    response.headers.set('X-Supabase-Client', 'contract-management-system/1.0')
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
        ...securityHeaders
      }
    })
  }
  
  // Log important requests for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 Middleware: ${request.method} ${request.nextUrl.pathname} - ${requestId}`)
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
