import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

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

const roleHierarchy: Record<Role, number> = {
  admin: 3,
  manager: 2,
  user: 1,
}

const rolePermissions: Record<Role, string[]> = {
  admin: ['*'],
  manager: [
    'read:contracts',
    'write:contracts',
    'delete:contracts',
    'read:analytics',
    'manage:users',
  ],
  user: ['read:contracts', 'write:contracts'],
}

export function RBACProvider({ children, user }: { children: React.ReactNode; user: User | null }) {
  const [userRoles, setUserRoles] = useState<Role[]>(['user'])

  useEffect(() => {
    async function loadUserRoles() {
      if (!user) {
        setUserRoles(['user'])
        return
      }

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error loading user roles:', error)
        return
      }

      setUserRoles(roles.map((r) => r.role as Role))
    }

    loadUserRoles()
  }, [user])

  const checkPermission = (permission: string) => {
    if (!user) return false

    const highestRole = userRoles.reduce((max, role) => 
      roleHierarchy[role] > roleHierarchy[max] ? role : max
    , 'user' as Role)

    const permissions = rolePermissions[highestRole]
    return permissions.includes('*') || permissions.includes(permission)
  }

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
