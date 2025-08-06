#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚨 Applying Emergency Authentication Fixes...\n')

const fixes = [
  {
    name: 'Update auth service with emergency fixes',
    source: './lib/auth-service-emergency-fix.ts',
    target: './lib/auth-service.ts',
    backup: true
  },
  {
    name: 'Update user profile hook with emergency fixes',
    source: './hooks/use-user-profile-emergency-fix.ts',
    target: './hooks/use-user-profile.ts',
    backup: true
  },
  {
    name: 'Update API route with emergency fixes',
    source: './app/api/users/sync/route-emergency-fix.ts',
    target: './app/api/users/sync/route.ts',
    backup: false // Already updated directly
  }
]

function createBackup(filePath) {
  const backupPath = filePath + '.backup.' + Date.now()
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath)
    console.log(`📋 Created backup: ${backupPath}`)
    return backupPath
  }
  return null
}

function applyFix(fix) {
  console.log(`🔧 Applying: ${fix.name}`)
  
  try {
    // Create backup if requested
    if (fix.backup) {
      createBackup(fix.target)
    }
    
    // Apply the fix
    if (fs.existsSync(fix.source)) {
      fs.copyFileSync(fix.source, fix.target)
      console.log(`✅ Applied: ${fix.name}`)
    } else {
      console.log(`⚠️  Source file not found: ${fix.source}`)
    }
  } catch (error) {
    console.error(`❌ Failed to apply ${fix.name}:`, error.message)
  }
}

// Apply all fixes
fixes.forEach(applyFix)

console.log('\n🎯 Creating emergency middleware fix...')

const emergencyMiddleware = `import { NextResponse } from "next/server"
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
}`

try {
  // Backup existing middleware
  createBackup('./middleware.ts')
  
  // Write emergency middleware
  fs.writeFileSync('./middleware.ts', emergencyMiddleware)
  console.log('✅ Applied emergency middleware fix')
} catch (error) {
  console.error('❌ Failed to apply middleware fix:', error.message)
}

console.log('\n🚀 Emergency fixes applied successfully!')
console.log('\n📋 Next steps:')
console.log('1. Restart your development server')
console.log('2. Clear browser cache and localStorage')
console.log('3. Test authentication flow')
console.log('4. Check console for any remaining errors')

console.log('\n🔧 If issues persist:')
console.log('- Try logging out and back in')
console.log('- Use incognito/private browsing mode')
console.log('- Check network tab for failed requests')
console.log('- Review console errors for specific issues')
