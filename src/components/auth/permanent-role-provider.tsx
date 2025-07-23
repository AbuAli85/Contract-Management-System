'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export type Role = 'admin' | 'manager' | 'user'

interface PermanentRoleContextType {
  role: Role
  setRole: (role: Role) => void
  isLoading: boolean
  isInitialized: boolean
  forceAdmin: () => void
  clearRole: () => void
}

const PermanentRoleContext = createContext<PermanentRoleContextType>({
  role: 'user',
  setRole: () => {},
  isLoading: true,
  isInitialized: false,
  forceAdmin: () => {},
  clearRole: () => {},
})

export function PermanentRoleProvider({ 
  children, 
  user 
}: { 
  children: React.ReactNode
  user: User | null 
}) {
  const [role, setRoleState] = useState<Role>('user')
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load permanent role from localStorage
  useEffect(() => {
    if (!user) {
      setRoleState('user')
      setIsLoading(false)
      setIsInitialized(true)
      return
    }

    console.log('🔄 Loading permanent role for user:', user.id)
    
    // Try to get permanent role from localStorage
    if (typeof window !== 'undefined') {
      const permanentRoleKey = `permanent_role_${user.id}`
      const cachedRole = localStorage.getItem(permanentRoleKey)
      
      if (cachedRole && ['admin', 'manager', 'user'].includes(cachedRole)) {
        console.log('✅ Permanent role loaded from localStorage:', cachedRole)
        setRoleState(cachedRole as Role)
        setIsLoading(false)
        setIsInitialized(true)
        return
      }
    }

    // If no permanent role found, try to get it from API
    loadPermanentRoleFromAPI()
  }, [user?.id])

  const loadPermanentRoleFromAPI = async () => {
    if (!user) return

    try {
      console.log('🔄 Loading permanent role from API...')
      
      const response = await fetch('/api/permanent-role-solution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success && data.permanentRole) {
        const newRole = data.permanentRole.value as Role
        console.log('✅ Permanent role loaded from API:', newRole)
        
        setRoleState(newRole)
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          const permanentRoleKey = `permanent_role_${user.id}`
          localStorage.setItem(permanentRoleKey, newRole)
          console.log('📦 Permanent role stored in localStorage:', newRole)
        }
      } else {
        console.log('⚠️ API failed, defaulting to admin')
        setRoleState('admin')
        
        // Store admin role in localStorage
        if (typeof window !== 'undefined') {
          const permanentRoleKey = `permanent_role_${user.id}`
          localStorage.setItem(permanentRoleKey, 'admin')
          console.log('📦 Admin role stored in localStorage')
        }
      }
    } catch (error) {
      console.log('❌ Error loading permanent role, defaulting to admin:', error)
      setRoleState('admin')
      
      // Store admin role in localStorage
      if (typeof window !== 'undefined') {
        const permanentRoleKey = `permanent_role_${user.id}`
        localStorage.setItem(permanentRoleKey, 'admin')
        console.log('📦 Admin role stored in localStorage (error fallback)')
      }
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }

  const setRole = (newRole: Role) => {
    console.log('🔄 Setting permanent role:', newRole)
    setRoleState(newRole)
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined' && user) {
      const permanentRoleKey = `permanent_role_${user.id}`
      localStorage.setItem(permanentRoleKey, newRole)
      console.log('📦 Permanent role updated in localStorage:', newRole)
    }
  }

  const forceAdmin = () => {
    console.log('🔄 Forcing admin role...')
    setRole('admin')
  }

  const clearRole = () => {
    console.log('🔄 Clearing permanent role...')
    setRoleState('user')
    
    // Remove from localStorage
    if (typeof window !== 'undefined' && user) {
      const permanentRoleKey = `permanent_role_${user.id}`
      localStorage.removeItem(permanentRoleKey)
      console.log('📦 Permanent role removed from localStorage')
    }
  }

  const value = {
    role,
    setRole,
    isLoading,
    isInitialized,
    forceAdmin,
    clearRole,
  }

  return (
    <PermanentRoleContext.Provider value={value}>
      {children}
    </PermanentRoleContext.Provider>
  )
}

export const usePermanentRole = () => {
  const context = useContext(PermanentRoleContext)
  if (!context) {
    throw new Error('usePermanentRole must be used within a PermanentRoleProvider')
  }
  return context
} 