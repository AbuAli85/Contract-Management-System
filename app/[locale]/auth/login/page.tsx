'use client'

import { LoginForm } from '@/auth/forms/login-form'
import { OAuthButtons } from '@/auth/forms/oauth-buttons'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const { user, loading, mounted } = useAuth()
  const router = useRouter()
  const [redirectAttempted, setRedirectAttempted] = useState(false)

  // Get current locale for links
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const locale = pathname.split('/')[1] || 'en'

  // Redirect if user is already logged in
  useEffect(() => {
    if (mounted && !loading && user && !redirectAttempted) {
      console.log('🔐 Login Page: User already authenticated, redirecting to dashboard')
      setRedirectAttempted(true)
      
      // Use window.location.href for more reliable redirect
      const dashboardUrl = `/${locale}/dashboard`
      console.log('🔐 Login Page: Redirecting to:', dashboardUrl)
      
      // Add a small delay to ensure state is stable
      setTimeout(() => {
        window.location.href = dashboardUrl
      }, 100)
    }
  }, [user, loading, mounted, locale, redirectAttempted])

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
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">If you're not redirected automatically, <button onClick={() => window.location.href = `/${locale}/dashboard`} className="text-blue-600 hover:underline">click here</button></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href={`/${locale}/auth/signup`} className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        
        <LoginForm />
        
        <OAuthButtons />
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic' 