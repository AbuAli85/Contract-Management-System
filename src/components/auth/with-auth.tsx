'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from './auth-provider'

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ProtectedRoute(props: P) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !user) {
        // Only run in browser environment
        if (typeof window !== 'undefined') {
          // Get the current locale from the URL
          const locale = window.location.pathname.split('/')[1]
          const isValidLocale = locale && locale.length === 2

          // Construct the login URL with the current locale
          const loginPath = `/${isValidLocale ? locale : 'en'}/auth/login`
          const redirectTo = window.location.href
          
          // Redirect to login with the current URL as the redirect target
          router.push(`${loginPath}?redirectTo=${encodeURIComponent(redirectTo)}`)
        }
      }
    }, [user, loading, router])

    if (loading) {
      return <div>Loading...</div>
    }

    if (!user) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
