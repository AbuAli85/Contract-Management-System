'use client'

import { useEffect } from 'react'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  fallback,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { user, loading: authLoading, mounted } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      console.log('🔒 ProtectedRoute: No user found, redirecting to login...')
      router.push(redirectTo)
    }
  }, [user, authLoading, mounted, router, redirectTo])

  // Show loading while checking authentication
  if (authLoading || !mounted) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin mr-2" /> Loading authentication...
      </div>
    )
  }

  // Show fallback or loading if no user
  if (!user) {
    // Add a small delay to prevent flash of redirect message
    return fallback || (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin mr-2" /> Checking authentication...
      </div>
    )
  }

  // User is authenticated, show protected content
  return <>{children}</>
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo?: string
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute redirectTo={redirectTo}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
} 