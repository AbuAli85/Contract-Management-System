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
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          console.log('✅ RoleLoader: Role loaded from API:', data.role.value)
          
          // Cache the role in localStorage
          localStorage.setItem(`user_role_${user.id}`, data.role.value)
          console.log('📦 RoleLoader: Role cached in localStorage:', data.role.value)
          
          // Only reload if the role is different from current
          const currentRole = localStorage.getItem(`user_role_${user.id}`)
          if (currentRole !== data.role.value) {
            console.log('🔄 RoleLoader: Forcing page reload to apply role...')
            setTimeout(() => {
              window.location.reload()
            }, 500)
          }
          
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
  }, [user?.id])

  // This component doesn't render anything
  return null
} 