'use client'

import { LoginForm } from '@/auth/forms/login-form'
import { OAuthButtons } from '@/auth/forms/oauth-buttons'
import { useAuth } from '@/src/components/auth/auth-provider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, loading, mounted } = useAuth()
  const router = useRouter()

  // Get current locale for links
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const locale = pathname.split('/')[1] || 'en'

  // Check server-side session when user exists but we're on login page
  useEffect(() => {
    if (user && !loading && mounted) {
      console.log('🔧 User exists on login page, checking server session...')
      const checkServerSession = async () => {
        try {
          const response = await fetch('/api/debug/session')
          const data = await response.json()
          console.log('🔧 Server session check result:', data)
          
          if (!data.debug?.hasSession) {
            console.log('🔧 Server has no session, clearing client state')
            // Force logout to clear client state
            await fetch('/api/force-logout')
            window.location.reload()
          }
        } catch (error) {
          console.error('🔧 Server session check failed:', error)
        }
      }
      
      // Add a small delay to allow middleware to process
      setTimeout(checkServerSession, 500)
    }
  }, [user, loading, mounted])

  // Manual redirect function for testing
  const handleManualRedirect = () => {
    console.log('🔧 Manual redirect triggered')
    router.push(`/${locale}/dashboard`)
  }

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

  // If user is already logged in, verify with server-side session check
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
          <button 
            onClick={handleManualRedirect}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manual Redirect (if stuck)
          </button>
          <button 
            onClick={async () => {
              console.log('🔧 Checking server-side session...')
              try {
                const response = await fetch('/api/debug/session')
                const data = await response.json()
                console.log('🔧 Server session check:', data)
                if (!data.debug?.hasSession) {
                  console.log('🔧 Server has no session, clearing client state')
                  // Force logout to clear client state
                  await fetch('/api/force-logout')
                  window.location.reload()
                }
              } catch (error) {
                console.error('🔧 Session check failed:', error)
              }
            }}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Check Server Session
          </button>
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
            <Link
              href={`/${locale}/auth/signup`}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <LoginForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6">
              <OAuthButtons />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 