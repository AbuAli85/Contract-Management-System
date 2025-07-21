'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import type { Role } from '@/types/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: Role | Role[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback = <div>Loading...</div>
}: ProtectedRouteProps) {
  const router = useRouter()
  const { role, loading } = useUserRole()

  useEffect(() => {
    if (!loading && !role) {
      // No user, redirect to login
      const currentPath = window.location.pathname
      router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`)
      return
    }

    if (!loading && requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      if (!roles.includes(role)) {
        // User doesn't have required role
        router.push('/unauthorized')
      }
    }
  }, [loading, role, requiredRole, router])

  if (loading) {
    return fallback
  }

  if (!role) {
    return null
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(role)) {
      return null
    }
  }

  return children
}
