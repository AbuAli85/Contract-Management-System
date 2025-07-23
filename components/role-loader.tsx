'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'

export function RoleLoader() {
  const { user } = useAuth()
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (!user || hasLoaded) return

    const loadRoleOnPageLoad = async () => {
      try {
        console.log('🔄 RoleLoader: Loading role on page load...')
        
        // Check if we already have a cached role
        const cachedRole = localStorage.getItem(`user_role_${user.id}`)
        if (cachedRole) {
          console.log('📦 RoleLoader: Found cached role:', cachedRole)
          setHasLoaded(true)
          return
        }

        // Load role from API if no cache
        const response = await fetch('/api/get-user-role', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        const data = await response.json()
        
        if (data.success) {
          console.log('✅ RoleLoader: Role loaded from API:', data.role.value)
          
          // Cache the role in localStorage
          localStorage.setItem(`user_role_${user.id}`, data.role.value)
          console.log('📦 RoleLoader: Role cached in localStorage:', data.role.value)
          
          // Force a page reload to ensure the role is properly loaded
          console.log('🔄 RoleLoader: Forcing page reload to apply role...')
          setTimeout(() => {
            window.location.reload()
          }, 500)
          
        } else {
          console.error('❌ RoleLoader: Failed to load role from API:', data.error)
        }
      } catch (error) {
        console.error('❌ RoleLoader: Error loading role from API:', error)
      } finally {
        setHasLoaded(true)
      }
    }

    loadRoleOnPageLoad()
  }, [user?.id, hasLoaded])

  // This component doesn't render anything
  return null
} 