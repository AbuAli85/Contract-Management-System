import { useEffect, useState } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'

export function useRoleLoader() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRoleFromAPI = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Loading role from API on page load...')
      
      const response = await fetch('/api/get-user-role', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Role loaded from API:', data.role.value)
        
        // Cache the role in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`user_role_${user.id}`, data.role.value)
          console.log('📦 Role cached in localStorage from API:', data.role.value)
        }
        
        // Force a page reload to ensure the role is properly loaded
        console.log('🔄 Forcing page reload to apply role...')
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
        }, 1000)
        
      } else {
        console.error('❌ Failed to load role from API:', data.error)
        setError(data.error)
      }
    } catch (error) {
      console.error('❌ Error loading role from API:', error)
      setError('Failed to load role')
    } finally {
      setIsLoading(false)
    }
  }

  // Load role on mount if user exists
  useEffect(() => {
    if (user && !isLoading) {
      loadRoleFromAPI()
    }
  }, [user?.id, isLoading])

  return {
    isLoading,
    error,
    loadRoleFromAPI
  }
} 