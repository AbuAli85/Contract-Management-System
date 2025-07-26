'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/src/components/auth/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSimpleWorkingAuth } from '@/src/components/auth/simple-working-auth-provider'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useSimpleWorkingAuth()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    // If user is already authenticated and not loading, redirect to dashboard
    if (!loading && user && !redirecting) {
      console.log('🔐 Login: User already authenticated, redirecting to dashboard')
      console.log('🔐 Login: User details:', { email: user.email, id: user.id })
      setRedirecting(true)
      
      // Use both router and window.location for reliability
      try {
        router.replace('/en/dashboard')
        // Fallback to window.location if router doesn't work
        setTimeout(() => {
          if (window.location.pathname !== '/en/dashboard') {
            console.log('🔐 Login: Router redirect failed, using window.location')
            window.location.href = '/en/dashboard'
          }
        }, 1000)
      } catch (error) {
        console.error('🔐 Login: Router error, using window.location:', error)
        window.location.href = '/en/dashboard'
      }
    }
  }, [user, loading, router, redirecting])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, show redirecting message
  if (user || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Redirecting to dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">If you're not redirected automatically, <button onClick={() => window.location.href = '/en/dashboard'} className="text-blue-600 underline">click here</button></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <LoginForm />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
