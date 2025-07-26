'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the working simple dashboard page
    router.replace('/simple-dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to working dashboard...</p>
      </div>
    </div>
  )
} 