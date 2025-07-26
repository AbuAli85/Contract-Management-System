'use client'

import { LoginForm } from '@/auth/forms/login-form'
import { OAuthButtons } from '@/auth/forms/oauth-buttons'
import { useAuth } from '@/src/components/auth/auth-provider'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

export default function LoginPage() {
  const { user, loading, mounted } = useAuth()
  const hasRedirected = useRef(false)

  useEffect(() => {
    console.log('🔍 Login Page Debug:', { user, loading, mounted })
  }, [user, loading, mounted])

  // If user is already logged in, redirect to dashboard
  if (mounted && !loading && user && !hasRedirected.current) {
    console.log('🔄 User already logged in, redirecting to dashboard')
    hasRedirected.current = true
    
    // Get the current locale from the URL
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    const locale = pathname.split('/')[1] || 'en'
    const redirectUrl = `/${locale}/dashboard`
    
    console.log('🔄 Redirecting to:', redirectUrl)
    
    // Use setTimeout to ensure the redirect happens after the current render
    setTimeout(() => {
      window.location.href = redirectUrl
    }, 100)
    
    return null
  }

  // Reset redirect flag if user is not logged in
  if (!user && hasRedirected.current) {
    hasRedirected.current = false
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
              href="/auth/signup"
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