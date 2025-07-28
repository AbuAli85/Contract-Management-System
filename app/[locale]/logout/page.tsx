"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/components/auth/auth-provider'
import { Loader2 } from 'lucide-react'

export default function LogoutPage() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<'logging-out' | 'error'>('logging-out')

  useEffect(() => {
    const handleLogout = async () => {
      try {
        console.log('🔐 Logout: Starting logout process...')
        
        // Get current locale from URL
        const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
        const locale = pathname.split('/')[1] || 'en'
        
        // Call signOut
        const result = await signOut()
        
        if (result.success) {
          console.log('🔐 Logout: Successfully logged out')
          
          // Clear any remaining client-side state
          if (typeof window !== 'undefined') {
            // Clear localStorage if any auth data is stored there
            localStorage.removeItem('supabase.auth.token')
            sessionStorage.clear()
          }
          
          // Redirect to localized login page
          router.push(`/${locale}/auth/login`)
        } else {
          console.error('🔐 Logout: Failed to logout:', result.error)
          setStatus('error')
          
          // Still redirect to login even if logout failed
          setTimeout(() => {
            router.push(`/${locale}/auth/login`)
          }, 3000)
        }
      } catch (error) {
        console.error('🔐 Logout: Unexpected error:', error)
        setStatus('error')
        
        // Get locale and redirect to login
        const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
        const locale = pathname.split('/')[1] || 'en'
        
        setTimeout(() => {
          router.push(`/${locale}/auth/login`)
        }, 3000)
      }
    }

    handleLogout()
  }, [signOut, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        {status === 'logging-out' ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
            <p className="text-gray-600">Please wait while we sign you out.</p>
          </>
        ) : (
          <>
            <div className="h-8 w-8 mx-auto mb-4 text-red-600">⚠️</div>
            <h1 className="text-2xl font-bold mb-4 text-red-600">Logout Error</h1>
            <p className="text-gray-600">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic' 