import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
// @ts-ignore
import createMiddleware from "next-intl/middleware"

// Create next-intl middleware
const intlMiddleware = createMiddleware({
  locales: ["en", "ar"],
  defaultLocale: "en",
})

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip all problematic routes to prevent infinite loops
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".") ||
    pathname.includes("/.well-known/") ||
    pathname.includes("?_rsc=") ||
    pathname.includes("?rsc=")
  ) {
    return NextResponse.next()
  }

  // Handle i18n routing for page routes only
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
} 