'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the working simple login page
    router.replace('/auth/simple-login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to working login page...</p>
      </div>
    </div>
  )
} 