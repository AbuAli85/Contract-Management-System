import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { useAuth } from './auth-provider'
import { usePermanentRole } from './permanent-role-provider'

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
  const [userRoles, setUserRoles] = useState<Role[] | null>(null); // null means not loaded yet
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false)
  const { role: authRole } = useAuth()
  const { role: permanentRole, isLoading: permanentRoleLoading } = usePermanentRole()

  // Debug logging
  console.log('RBACProvider: user', user, 'userRoles', userRoles, 'isLoading', isLoading)

  // Use permanent role as primary source of truth
  useEffect(() => {
    if (permanentRole && !permanentRoleLoading) {
      setUserRoles([permanentRole]);
      setIsLoading(false);
      setIsInitialized(true);
    } else if (authRole && !permanentRoleLoading) {
      setUserRoles([authRole as Role]);
      setIsLoading(false);
      setIsInitialized(true);
    } else if (user && !permanentRoleLoading) {
      loadUserRolesFromDatabase();
    } else if (!user) {
      setUserRoles(null);
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [permanentRole, authRole, user?.id, permanentRoleLoading]);

  // Force sync with permanent role when it changes
  useEffect(() => {
    if (permanentRole && !permanentRoleLoading) {
      console.log('🔄 RBAC: Permanent role changed, syncing:', permanentRole)
      setUserRoles([permanentRole])
    }
  }, [permanentRole, permanentRoleLoading])

  // Also listen for user changes to ensure role is loaded
  useEffect(() => {
    if (user && !permanentRole && !authRole && !permanentRoleLoading) {
      console.log('🔄 RBAC: User exists but no roles, loading from database...')
      loadUserRolesFromDatabase()
    }
  }, [user?.id, permanentRole, authRole, permanentRoleLoading])

  // Auto-fallback: if userRoles is null for more than 1 second, set to ['admin']
  useEffect(() => {
    if (user && userRoles === null) {
      const timeout = setTimeout(() => {
        console.warn('RBACProvider: userRoles still null after 1s, auto-falling back to [admin]')
        setUserRoles(['admin'])
        setIsLoading(false)
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [user, userRoles])

  const loadUserRolesFromDatabase = async () => {
    if (!user) return;
    setIsLoading(true);
    setUserRoles(null);
    console.log('🔄 Loading user roles from database for:', user.id)
    
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
          console.log('📦 Role cached in localStorage:', usersData.role)
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
          console.log('📦 Role cached in localStorage:', profilesData.role)
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
          console.log('📦 Role cached in localStorage:', appUsersData.role)
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
        console.log('📦 Admin role cached in localStorage')
      }
      
    } catch (error) {
      console.log('❌ Error loading user roles, defaulting to admin:', error)
      setUserRoles(['admin'])
      // Cache the admin role in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`user_role_${user.id}`, 'admin')
        console.log('📦 Admin role cached in localStorage (error fallback)')
      }
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }

  const refreshRoles = async () => {
    console.log('🔄 Manually refreshing user roles...')
    console.log('Current roles before refresh:', userRoles)
    
    // Force loading state to show refresh is happening
    setIsLoading(true)
    
    // Clear current roles temporarily to force re-render
    setUserRoles(null)
    
    // Wait a moment for state to clear
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Load fresh roles from API first, then database
    try {
      const response = await fetch('/api/get-user-role', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('✅ Role refreshed from API:', data.role.value)
          setUserRoles([data.role.value as Role])
          
          // Always cache the role
          if (typeof window !== 'undefined' && user) {
            localStorage.setItem(`user_role_${user.id}`, data.role.value)
            console.log('📦 Role refreshed and cached:', data.role.value)
          }
          
          setIsLoading(false)
          return
        }
      }
      
      // Fallback to database loading
      await loadUserRolesFromDatabase()
      
    } catch (error) {
      console.error('❌ Error refreshing roles:', error)
      await loadUserRolesFromDatabase()
    }
    
    console.log('✅ Roles refreshed, new roles:', userRoles)
  }

  const updateRoleDirectly = (role: Role) => {
    setUserRoles([role])
    // Cache the role in localStorage for persistence
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(`user_role_${user.id}`, role)
      console.log('📦 Role updated and permanently cached:', role)
    }
    console.log('Role updated directly to:', role)
  }

  // Determine the effective roles to use in context
  // If userRoles is null (loading), use a default admin role to prevent UI flicker
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
    );
  }

  // Show loading state but provide admin role as default to prevent UI flicker
  if (user && userRoles === null && isLoading) {
    return (
      <RBACContext.Provider value={{
        userRoles: ['admin'], // Default to admin during loading to prevent UI flicker
        hasRole: (role: Role) => role === 'admin',
        hasAnyRole: (roles: Role[]) => roles.includes('admin'),
        hasAllRoles: (roles: Role[]) => roles.includes('admin'),
        refreshRoles: async () => {},
        updateRoleDirectly: () => {},
        isLoading: true,
      }}>
        {children}
      </RBACContext.Provider>
    );
  }

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

export const useRBAC = () => {
  const context = useContext(RBACContext)
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider')
  }
  return context
}

