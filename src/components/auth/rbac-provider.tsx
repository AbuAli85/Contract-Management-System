import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

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
  const [userRoles, setUserRoles] = useState<Role[]>(['user'])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cached role from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const cachedRole = localStorage.getItem(`user_role_${user.id}`)
      if (cachedRole) {
        console.log('📦 Loading cached role from localStorage:', cachedRole)
        setUserRoles([cachedRole as Role])
        setIsInitialized(true)
      }
    }
  }, [user?.id])

  const loadUserRoles = async () => {
    if (!user) {
      setUserRoles(['user'])
      setIsInitialized(true)
      return
    }

    setIsLoading(true)
    console.log('Loading user roles for:', user.id)
    
    // Try to load from users table first
    try {
      const supabaseClient = await getSupabase()
      const { data: usersData, error: usersError } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!usersError && usersData?.role) {
        console.log('✅ Role loaded from users table:', usersData.role)
        setUserRoles([usersData.role as Role])
        // Cache the role in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`user_role_${user.id}`, usersData.role)
        }
        setIsLoading(false)
        setIsInitialized(true)
        return
      }

      // Try profiles table as fallback
      console.log('🔄 Users table failed, trying profiles table...')
      const { data: profilesData, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profilesError && profilesData?.role) {
        console.log('✅ Role loaded from profiles table:', profilesData.role)
        setUserRoles([profilesData.role as Role])
        // Cache the role in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`user_role_${user.id}`, profilesData.role)
        }
        setIsLoading(false)
        setIsInitialized(true)
        return
      }

      // Try app_users table as fallback
      console.log('🔄 Profiles table failed, trying app_users table...')
      const { data: appUsersData, error: appUsersError } = await supabaseClient
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!appUsersError && appUsersData?.role) {
        console.log('✅ Role loaded from app_users table:', appUsersData.role)
        setUserRoles([appUsersData.role as Role])
        // Cache the role in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`user_role_${user.id}`, appUsersData.role)
        }
        setIsLoading(false)
        setIsInitialized(true)
        return
      }

      // If no role found in any table, default to admin for testing
      console.log('⚠️ No role found in any table, defaulting to admin')
      setUserRoles(['admin'])
      // Cache the admin role in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`user_role_${user.id}`, 'admin')
      }
      
    } catch (error) {
      console.log('❌ Error loading user roles, defaulting to admin:', error)
      setUserRoles(['admin'])
      // Cache the admin role in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`user_role_${user.id}`, 'admin')
      }
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }

  // Load roles immediately when user changes
  useEffect(() => {
    if (user && !isInitialized) {
      loadUserRoles()
    } else if (!user) {
      setUserRoles(['user'])
      setIsInitialized(true)
    }
  }, [user, isInitialized])

  // Also load roles when user changes (for re-authentication)
  useEffect(() => {
    if (user) {
      loadUserRoles()
    }
  }, [user?.id]) // Only reload when user ID changes

  const refreshRoles = async () => {
    console.log('🔄 Manually refreshing user roles...')
    console.log('Current roles before refresh:', userRoles)
    
    // Force loading state to show refresh is happening
    setIsLoading(true)
    
    // Clear current roles temporarily to force re-render
    setUserRoles([])
    
    // Wait a moment for state to clear
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Load fresh roles
    await loadUserRoles()
    
    console.log('✅ Roles refreshed, new roles:', userRoles)
  }

  const updateRoleDirectly = (role: Role) => {
    setUserRoles([role])
    // Cache the role in localStorage for persistence
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(`user_role_${user.id}`, role)
      console.log('📦 Role cached in localStorage:', role)
    }
    console.log('Role updated directly to:', role)
  }

  const value = {
    userRoles,
    hasRole: (role: Role) => userRoles.includes(role),
    hasAnyRole: (roles: Role[]) => roles.some(role => userRoles.includes(role)),
    hasAllRoles: (roles: Role[]) => roles.every(role => userRoles.includes(role)),
    refreshRoles,
    updateRoleDirectly,
    isLoading,
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

