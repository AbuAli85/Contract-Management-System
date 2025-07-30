'use client'

import { LoginForm } from '@/auth/forms/login-form'
import { OAuthButtons } from '@/auth/forms/oauth-buttons'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const { user, loading, mounted } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [redirectAttempted, setRedirectAttempted] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)

  // Get current locale for links
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const locale = pathname.split('/')[1] || 'en'

  // Check for OAuth errors in URL parameters
  useEffect(() => {
    const error = searchParams?.get('error')
    const message = searchParams?.get('message')
    
    if (error && message) {
      setOauthError(`${error}: ${message}`)
      // Clear the error from URL after displaying it
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('error')
      newUrl.searchParams.delete('message')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])

  // Only redirect if user is already logged in AND we're on the login page
  useEffect(() => {
    if (mounted && !loading && user && !redirectAttempted) {
      // Only redirect if we're actually on the login page and not already on dashboard
      if (pathname.includes('/auth/login') && !pathname.includes('/dashboard')) {
        console.log('🔐 Login Page: User already authenticated, redirecting to dashboard')
        setRedirectAttempted(true)
        
        // Use Next.js router for client-side navigation
        const dashboardUrl = `/${locale}/dashboard`
        console.log('🔐 Login Page: Redirecting to:', dashboardUrl)
        
        // Use router.push for client-side navigation
        router.push(dashboardUrl)
      }
    }
  }, [user, loading, mounted, locale, redirectAttempted, router, pathname])

  // Show loading while checking authentication
  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is already logged in, show redirect message
  if (user && pathname.includes('/auth/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">
            If you're not redirected automatically,{' '}
            <button 
              onClick={() => router.push(`/${locale}/dashboard`)} 
              className="text-blue-600 hover:underline"
            >
              click here
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href={`/${locale}/auth/signup`} className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {oauthError && (
          <Alert variant="destructive">
            <AlertDescription>{oauthError}</AlertDescription>
          </Alert>
        )}
        
        <LoginForm />
        
        <OAuthButtons />
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic' 