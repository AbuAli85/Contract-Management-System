import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export function createClient(request: NextRequest) {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // Set cookie with proper domain for production
          const hostname = request.headers.get('host') || ''
          const cookieOptions: any = {
            name,
            value,
            ...options,
          }
          
          // Add domain for custom domains
          if (hostname.includes('portal.thesmartpro.io')) {
            cookieOptions.domain = '.thesmartpro.io'
          }
          
          response.cookies.set(cookieOptions)
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // Remove cookie with proper domain for production
          const hostname = request.headers.get('host') || ''
          const cookieOptions: any = {
            name,
            value: '',
            ...options,
          }
          
          // Add domain for custom domains
          if (hostname.includes('portal.thesmartpro.io')) {
            cookieOptions.domain = '.thesmartpro.io'
          }
          
          response.cookies.set(cookieOptions)
        },
      },
    }
  )

  return supabase
} 