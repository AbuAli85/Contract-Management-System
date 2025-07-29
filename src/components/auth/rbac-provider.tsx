'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './simple-auth-provider'

// Define the Role type
export type Role = 'admin' | 'manager' | 'user'

// RBAC Context Type
interface RBACContextType {
  userRoles: Role[]
  isLoading: boolean
  refreshRoles: () => Promise<void>
  updateRoleDirectly: (role: Role) => void
}

const RBACContext = createContext<RBACContextType | undefined>(undefined)

// RBAC Provider Component
export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const [userRoles, setUserRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load user roles from profile or default to user role
  const loadUserRoles = useCallback(async () => {
    if (!user) {
      setUserRoles([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      // Try to get roles from profile first
      if (profile?.role) {
        setUserRoles([profile.role as Role])
        setIsLoading(false)
        return
      }

      // Fallback: fetch roles from API
      const response = await fetch('/api/get-user-role', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.role) {
          setUserRoles([data.role as Role])
        } else {
          setUserRoles(['user'])
        }
      } else {
        // Default to user role if API fails
        setUserRoles(['user'])
      }
    } catch (error) {
      console.error('Error loading user roles:', error)
      setUserRoles(['user'])
    } finally {
      setIsLoading(false)
    }
  }, [user, profile])

  // Refresh roles from server
  const refreshRoles = useCallback(async () => {
    await loadUserRoles()
  }, [loadUserRoles])

  // Update role directly (for immediate updates)
  const updateRoleDirectly = useCallback((role: Role) => {
    setUserRoles([role])
  }, [])

  // Load roles when user changes
  useEffect(() => {
    loadUserRoles()
  }, [loadUserRoles])

  const value: RBACContextType = {
    userRoles,
    isLoading,
    refreshRoles,
    updateRoleDirectly,
  }

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  )
}

// Hook to use RBAC context
export function useRBAC() {
  const context = useContext(RBACContext)
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider')
  }
  return context
} 