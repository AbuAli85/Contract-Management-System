// Status indicator for hybrid authentication mode
"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/app/providers"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Shield, Wifi, WifiOff } from "lucide-react"

export function AuthStatusIndicator() {
  const { user, session, supabase } = useSupabase()
  const [isClient, setIsClient] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && supabase) {
      setAuthReady(true)
    }
  }, [isClient, supabase])

  // Don't show indicator during SSR
  if (!isClient) return null

  // Show different states based on auth status
  if (!authReady) {
    return (
      <Alert className="mb-4 border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          🔄 Initializing authentication system...
        </AlertDescription>
      </Alert>
    )
  }

  if (!supabase) {
    return (
      <Alert className="mb-4 border-orange-200 bg-orange-50">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          ⚠️ Authentication service unavailable - check environment variables
        </AlertDescription>
      </Alert>
    )
  }

  if (user && session) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✅ Authentication active - Welcome, {user.email}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Wifi className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        🔐 Authentication ready - Please sign in to continue
      </AlertDescription>
    </Alert>
  )
}
