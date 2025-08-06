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
    return NextResponse.next()
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
      return response
    }
    // Fallback redirect
    return NextResponse.redirect(new URL("/en", request.url))
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