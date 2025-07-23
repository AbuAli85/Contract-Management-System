'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'

export function RoleLoader() {
  const { user } = useAuth()
  const [hasLoaded, setHasLoaded] = useState(false)
  const hasRunRef = useRef(false)

  useEffect(() => {
    // Prevent running multiple times
    if (hasRunRef.current || !user) return
    hasRunRef.current = true

    const loadRoleOnPageLoad = async () => {
      try {
        console.log('🔄 RoleLoader: Loading role on page load...')
        
        // Check if we already have a cached role
        const cachedRole = localStorage.getItem(`user_role_${user.id}`)
        if (cachedRole && ['admin', 'manager', 'user'].includes(cachedRole)) {
          console.log('📦 RoleLoader: Found cached role:', cachedRole)
          setHasLoaded(true)
          return
        }

        // Load role from API immediately
        const response = await fetch('/api/get-user-role', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          console.log('✅ RoleLoader: Role loaded from API:', data.role.value)
          
          // Cache the role immediately
          localStorage.setItem(`user_role_${user.id}`, data.role.value)
          console.log('📦 RoleLoader: Role cached immediately:', data.role.value)
          
          setHasLoaded(true)
        } else {
          console.error('❌ RoleLoader: Failed to load role from API:', data.error)
          // Set a default admin role if API fails
          localStorage.setItem(`user_role_${user.id}`, 'admin')
          console.log('📦 RoleLoader: Default admin role cached')
          setHasLoaded(true)
        }
        
      } catch (error) {
        console.error('❌ RoleLoader: Error loading role:', error)
        // Set a default admin role on error
        localStorage.setItem(`user_role_${user.id}`, 'admin')
        console.log('📦 RoleLoader: Default admin role cached (error fallback)')
        setHasLoaded(true)
      }
    }

    // Load role immediately
    loadRoleOnPageLoad()
  }, [user?.id])

  // This component doesn't render anything, it just loads the role
  return null
} 