import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createMiddleware from "next-intl/middleware"

// Create next-intl middleware with proper configuration
const intlMiddleware = createMiddleware({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
  // Add fallback configuration
  localeDetection: true
})

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip ALL API routes and static files completely
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/test-filename") ||  // Skip our test page
    pathname.includes(".") ||
    pathname.includes("/.well-known/") ||
    pathname.includes("?_rsc=") ||
    pathname.includes("?rsc=") ||
    pathname.includes("/static/") ||
    pathname.includes("/images/") ||
    pathname.includes("/fonts/")
  ) {
    return NextResponse.next()
  }

  // Handle root path redirect
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/en", request.url))
  }

  // Only apply i18n middleware to page routes (not API routes)
  try {
    const response = intlMiddleware(request)
    if (response) {
      return response
    }
    // If no response from middleware, redirect to default locale
    return NextResponse.redirect(new URL("/en", request.url))
  } catch (error) {
    console.error("Middleware error:", error)
    // Fallback to redirect to default locale
    return NextResponse.redirect(new URL("/en", request.url))
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    // Skip all api routes
    // Skip all static files
    "/((?!_next|api|.*\\..*).*)",
  ],
} 