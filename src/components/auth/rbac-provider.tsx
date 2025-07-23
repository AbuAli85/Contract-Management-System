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
          return
        }

        // If no role found in any table, default to admin for testing
        console.log('⚠️ No role found in any table, defaulting to admin')
        setUserRoles(['admin'])
        
      } catch (error) {
        console.log('❌ Error loading user roles, defaulting to admin:', error)
        setUserRoles(['admin'])
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
