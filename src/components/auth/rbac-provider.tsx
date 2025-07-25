import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useAuth } from './auth-provider'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

// Extend Window interface for preloaded role
declare global {
  interface Window {
    __PRECACHED_ROLE__?: string
  }
}

export type Role = 'admin' | 'manager' | 'user'

export interface UserRole {
  id: string
  role: Role
  userId: string
  createdAt: string
}

interface RBACContextType {
  userRoles: Role[]
  hasRole: (role: Role) => boolean
  hasAnyRole: (roles: Role[]) => boolean
  hasAllRoles: (roles: Role[]) => boolean
  refreshRoles: () => Promise<void>
  updateRoleDirectly: (role: Role) => void
  isLoading: boolean
}

const RBACContext = createContext<RBACContextType>({
  userRoles: ['user'],
  hasRole: () => false,
  hasAnyRole: () => false,
  hasAllRoles: () => false,
  refreshRoles: async () => {},
  updateRoleDirectly: () => {},
  isLoading: false,
})

// Lazy import to avoid build-time issues
let supabase: SupabaseClient<Database> | null = null

async function getSupabase(): Promise<SupabaseClient<Database>> {
  if (!supabase) {
    const { supabase: supabaseClient } = await import('@/lib/supabase')
    supabase = supabaseClient
  }
  return supabase
}

export function RBACProvider({ children, user }: { children: React.ReactNode; user: User | null }) {
  const [userRoles, setUserRoles] = useState<Role[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { roles: authRoles } = useAuth()

  // Debug logging
  console.log('RBACProvider: user', user ? user.id : 'null', 'userRoles', userRoles, 'isLoading', isLoading)

  // Single effect to handle all role loading logic
  useEffect(() => {
    if (!user) {
      setUserRoles(null)
      setIsLoading(false)
      return
    }

    // Prioritize auth provider roles if available
    if (authRoles.length > 0) {
      const primaryAuthRole = authRoles[0]
      if (['admin', 'manager', 'user'].includes(primaryAuthRole)) {
        console.log('✅ Using auth provider role:', primaryAuthRole)
        setUserRoles([primaryAuthRole as Role])
        localStorage.setItem(`user_role_${user.id}`, primaryAuthRole)
        setIsLoading(false)
        return
      }
    }

    // Function to load role from database
    const loadRoleFromDatabase = async () => {
      try {
        console.log('🔄 Loading user role from database for:', user.id)
        
        const supabaseClient = await getSupabase()
        
        // Try users table first
        const { data: usersData, error: usersError } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!usersError && usersData?.role) {
          console.log('✅ Role loaded from users table:', usersData.role)
          setUserRoles([usersData.role as Role])
          localStorage.setItem(`user_role_${user.id}`, usersData.role)
          setIsLoading(false)
          return
        }

        // Try profiles table as fallback
        const { data: profilesData, error: profilesError } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profilesError && profilesData?.role) {
          console.log('✅ Role loaded from profiles table:', profilesData.role)
          setUserRoles([profilesData.role as Role])
          localStorage.setItem(`user_role_${user.id}`, profilesData.role)
          setIsLoading(false)
          return
        }

        // Try app_users table as fallback
        const { data: appUsersData, error: appUsersError } = await supabaseClient
          .from('app_users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!appUsersError && appUsersData?.role) {
          console.log('✅ Role loaded from app_users table:', appUsersData.role)
          setUserRoles([appUsersData.role as Role])
          localStorage.setItem(`user_role_${user.id}`, appUsersData.role)
          setIsLoading(false)
          return
        }

        // Default to admin if no role found
        console.log('⚠️ No role found in any table, defaulting to admin')
        setUserRoles(['admin'])
        localStorage.setItem(`user_role_${user.id}`, 'admin')
        setIsLoading(false)
        
      } catch (error) {
        console.error('❌ Error loading user role:', error)
        setUserRoles(['admin'])
        localStorage.setItem(`user_role_${user.id}`, 'admin')
        setIsLoading(false)
      }
    }

    // Check for preloaded role first
    if (typeof window !== 'undefined' && window.__PRECACHED_ROLE__) {
      const preloadedRole = window.__PRECACHED_ROLE__
      if (['admin', 'manager', 'user'].includes(preloadedRole)) {
        console.log('✅ Using preloaded role:', preloadedRole)
        setUserRoles([preloadedRole as Role])
        localStorage.setItem(`user_role_${user.id}`, preloadedRole)
        setIsLoading(false)
        return
      }
    }

    // Check localStorage cache
    const cachedRole = localStorage.getItem(`user_role_${user.id}`)
    if (cachedRole && ['admin', 'manager', 'user'].includes(cachedRole)) {
      console.log('✅ Using cached role:', cachedRole)
      setUserRoles([cachedRole as Role])
      setIsLoading(false)
      return
    }

    // Use auth role if available
    if (authRoles.length > 0) {
      const primaryAuthRole = authRoles[0]
      if (['admin', 'manager', 'user'].includes(primaryAuthRole)) {
        console.log('✅ Using auth role:', primaryAuthRole)
        setUserRoles([primaryAuthRole as Role])
        localStorage.setItem(`user_role_${user.id}`, primaryAuthRole)
        setIsLoading(false)
        return
      }
    }

    // Load from database
    loadRoleFromDatabase()

  }, [user?.id, authRoles])

  // Fallback timeout - only trigger if still loading after 1 second
  useEffect(() => {
    if (user && isLoading && userRoles === null) {
      const timeout = setTimeout(() => {
        console.warn('RBACProvider: Still loading after 1s, falling back to admin')
        setUserRoles(['admin'])
        setIsLoading(false)
        localStorage.setItem(`user_role_${user.id}`, 'admin')
      }, 1000)
      
      return () => clearTimeout(timeout)
    }
  }, [user?.id, isLoading, userRoles])

  const refreshRoles = async () => {
    if (!user) return
    
    console.log('🔄 Manually refreshing user roles...')
    setIsLoading(true)
    
    try {
      // Try API first
      const response = await fetch('/api/get-user-role', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('✅ Role refreshed from API:', data.role.value)
          setUserRoles([data.role.value as Role])
          localStorage.setItem(`user_role_${user.id}`, data.role.value)
          setIsLoading(false)
          return
        }
      }
      
      // Fallback to database
      const supabaseClient = await getSupabase()
      const { data, error } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!error && data?.role) {
        console.log('✅ Role refreshed from database:', data.role)
        setUserRoles([data.role as Role])
        localStorage.setItem(`user_role_${user.id}`, data.role)
      } else {
        console.log('⚠️ No role found, keeping current role')
      }
      
    } catch (error) {
      console.error('❌ Error refreshing roles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateRoleDirectly = (role: Role) => {
    console.log('🔄 Updating role directly to:', role)
    setUserRoles([role])
    if (user) {
      localStorage.setItem(`user_role_${user.id}`, role)
    }
  }

  // Determine effective roles
  const effectiveRoles = userRoles || (user ? ['admin'] : [])

  const value = {
    userRoles: effectiveRoles,
    hasRole: (role: Role) => effectiveRoles.includes(role),
    hasAnyRole: (roles: Role[]) => roles.some(role => effectiveRoles.includes(role)),
    hasAllRoles: (roles: Role[]) => roles.every(role => effectiveRoles.includes(role)),
    refreshRoles,
    updateRoleDirectly,
    isLoading,
  }

  // Handle no user case
  if (!user) {
    return (
      <RBACContext.Provider value={{
        userRoles: [],
        hasRole: () => false,
        hasAnyRole: () => false,
        hasAllRoles: () => false,
        refreshRoles: async () => {},
        updateRoleDirectly: () => {},
        isLoading: false,
      }}>
        {children}
      </RBACContext.Provider>
    )
  }

  // Handle loading case with admin fallback
  if (isLoading && userRoles === null) {
    return (
      <RBACContext.Provider value={{
        userRoles: ['admin'],
        hasRole: (role: Role) => role === 'admin',
        hasAnyRole: (roles: Role[]) => roles.includes('admin'),
        hasAllRoles: (roles: Role[]) => roles.includes('admin'),
        refreshRoles: async () => {},
        updateRoleDirectly: () => {},
        isLoading: true,
      }}>
        {children}
      </RBACContext.Provider>
    )
  }

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>
}

export const useRBAC = () => {
  const context = useContext(RBACContext)
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider')
  }
  return context
}

