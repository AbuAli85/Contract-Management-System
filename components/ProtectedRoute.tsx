"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserRole } from "@/hooks/useUserRole"
import type { Role } from "@/src/components/auth/rbac-provider"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: Role | Role[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback = <div>Loading...</div>,
}: ProtectedRouteProps) {
  const router = useRouter()
  const role = useUserRole()

  useEffect(() => {
    if (role === null) {
      // No user, redirect to login
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname
        router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`)
      }
      return
    }

    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      if (!roles.includes(role as Role)) {
        // User doesn't have required role
        router.push("/unauthorized")
      }
    }
  }, [role, requiredRole, router])

  if (role === null) {
    return fallback
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(role as Role)) {
      return null
    }
  }

  return children
}
