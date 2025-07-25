'use client'

import { useAuth } from '@/src/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
  requiredRoles?: string[]
  requiredPermissions?: string[]
  fallback?: React.ReactNode
}

export function AuthenticatedLayout({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallback
}: AuthenticatedLayoutProps) {
  const { user, profile, roles, loading, mounted } = useAuth()
  const router = useRouter()

  // Check if user has required roles
  const hasRequiredRole = requiredRoles.length === 0 || 
    requiredRoles.some(role => roles.includes(role))

  // Check if user has required permissions
  const hasRequiredPermissions = requiredPermissions.length === 0 ||
    requiredPermissions.every(permission => {
      if (!profile?.permissions) return false
      return profile.permissions.includes(permission)
    })

  useEffect(() => {
    if (mounted && !loading) {
      if (!user) {
        router.push('/auth/login')
        return
      }

      if (!hasRequiredRole) {
        router.push('/not-authorized')
        return
      }

      if (!hasRequiredPermissions) {
        router.push('/not-authorized')
        return
      }
    }
  }, [user, loading, mounted, hasRequiredRole, hasRequiredPermissions, router])

  // Show loading state while checking authentication
  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show fallback or redirect if not authenticated
  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show fallback or redirect if not authorized
  if (!hasRequiredRole || !hasRequiredPermissions) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to unauthorized page...</p>
        </div>
      </div>
    )
  }

  // Render children if all checks pass
  return <>{children}</>
}

// Higher-order component for role-based access
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[],
  requiredPermissions?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthenticatedLayout
        requiredRoles={requiredRoles}
        requiredPermissions={requiredPermissions}
      >
        <Component {...props} />
      </AuthenticatedLayout>
    )
  }
} 