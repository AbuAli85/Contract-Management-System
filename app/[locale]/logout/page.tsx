"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/components/auth/auth-provider'

export default function LogoutPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut()
        router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
        router.push('/login')
      }
    }

    handleLogout()
  }, [signOut, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
        <p className="text-muted-foreground">Please wait while we sign you out.</p>
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic' 