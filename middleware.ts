import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Temporarily disable middleware completely to fix React hooks error
// export function middleware(request: NextRequest) {
//   return NextResponse.next()
// }

// export const config = {
//   matcher: [
//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//   ],
// }
