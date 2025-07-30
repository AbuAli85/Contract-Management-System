#!/usr/bin/env node

/**
 * Emergency Fix Script for Contract Management System
 * Addresses infinite loop and system damage issues
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY SYSTEM FIX');
console.log('========================');

// 1. Kill any existing Node processes
console.log('1. Stopping all Node processes...');
try {
  const { execSync } = require('child_process');
  execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
  console.log('✅ Node processes stopped');
} catch (error) {
  console.log('⚠️  No Node processes found or already stopped');
}

// 2. Clear Next.js cache
console.log('2. Clearing Next.js cache...');
try {
  const cacheDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('✅ Next.js cache cleared');
  }
} catch (error) {
  console.log('⚠️  Could not clear cache:', error.message);
}

// 3. Clear node_modules cache
console.log('3. Clearing node_modules cache...');
try {
  const nodeModulesDir = path.join(process.cwd(), 'node_modules', '.cache');
  if (fs.existsSync(nodeModulesDir)) {
    fs.rmSync(nodeModulesDir, { recursive: true, force: true });
    console.log('✅ Node modules cache cleared');
  }
} catch (error) {
  console.log('⚠️  Could not clear node_modules cache:', error.message);
}

// 4. Create a minimal middleware backup
console.log('4. Creating middleware backup...');
try {
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  const backupPath = path.join(process.cwd(), 'middleware.backup.ts');
  
  if (fs.existsSync(middlewarePath)) {
    fs.copyFileSync(middlewarePath, backupPath);
    console.log('✅ Middleware backup created');
  }
} catch (error) {
  console.log('⚠️  Could not create backup:', error.message);
}

// 5. Create a minimal middleware for testing
console.log('5. Creating minimal middleware...');
const minimalMiddleware = `import { NextResponse } from "next/server"
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
`;

try {
  fs.writeFileSync(path.join(process.cwd(), 'middleware.minimal.ts'), minimalMiddleware);
  console.log('✅ Minimal middleware created');
} catch (error) {
  console.log('⚠️  Could not create minimal middleware:', error.message);
}

console.log('\n🎯 EMERGENCY FIX COMPLETE');
console.log('========================');
console.log('Next steps:');
console.log('1. Run: npm run dev');
console.log('2. If issues persist, rename middleware.minimal.ts to middleware.ts');
console.log('3. Restart the development server');
console.log('\nThe system should now be stable and responsive.'); 