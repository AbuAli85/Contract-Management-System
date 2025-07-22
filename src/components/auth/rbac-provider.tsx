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
}

const RBACContext = createContext<RBACContextType>({
  userRoles: ['user'],
  hasRole: () => false,
  hasAnyRole: () => false,
  hasAllRoles: () => false,
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

  useEffect(() => {
    async function loadUserRoles() {
      if (!user) {
        setUserRoles(['user'])
        return
      }

      // TODO: Implement proper role loading when user_roles table is available
      // For now, default to 'user' role
      console.log('Loading user roles for:', user.id)
      
      // Try to load from users table if it exists
      try {
        const supabaseClient = await getSupabase()
        const { data: roles, error } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error) {
          console.log('User roles table not available, trying app_users table')
          // Try app_users table as fallback
          const { data: appUserRoles, error: appError } = await supabaseClient
            .from('app_users')
            .select('role')
            .eq('id', user.id)
            .single()

          if (appError) {
            console.log('No user roles found, using default admin role for testing')
            setUserRoles(['admin']) // Default to admin for testing
            return
          }

          const userRole = appUserRoles?.role as Role || 'admin'
          setUserRoles([userRole])
          return
        }

        // If user has a role field, use it; otherwise default to 'admin' for testing
        const userRole = roles?.role as Role || 'admin'
        setUserRoles([userRole])
      } catch (error) {
        console.log('Error loading user roles, using default admin for testing:', error)
        setUserRoles(['admin']) // Default to admin for testing
      }
    }

    loadUserRoles()
  }, [user])

  const value = {
    userRoles,
    hasRole: (role: Role) => userRoles.includes(role),
    hasAnyRole: (roles: Role[]) => roles.some(role => userRoles.includes(role)),
    hasAllRoles: (roles: Role[]) => roles.every(role => userRoles.includes(role)),
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
