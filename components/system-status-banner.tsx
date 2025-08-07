"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/app/providers"

export function SystemStatusBanner() {
  const { user, session, supabase } = useSupabase()
  const [isClient, setIsClient] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't show during SSR
  if (!isClient) return null

  // Auto-hide banner after 5 seconds if user is authenticated
  useEffect(() => {
    if (user && session) {
      const timer = setTimeout(() => setShowBanner(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [user, session])

  if (!showBanner) return null

  // Determine current status
  let status = "initializing"
  let message = "🔄 Hybrid Authentication System - Initializing..."
  let bgColor = "bg-blue-100"
  let textColor = "text-blue-800"
  let borderColor = "border-blue-200"

  if (!supabase) {
    status = "no-credentials"
    message = "⚠️ Hybrid Mode: Authentication service unavailable - check environment variables"
    bgColor = "bg-orange-100"
    textColor = "text-orange-800"
    borderColor = "border-orange-200"
  } else if (user && session) {
    status = "authenticated"
    message = `✅ Hybrid Authentication Active - Welcome, ${user.email}`
    bgColor = "bg-green-100"
    textColor = "text-green-800"
    borderColor = "border-green-200"
  } else if (supabase && !user) {
    status = "ready"
    message = "🔐 Hybrid Authentication Ready - Authentication system active, please sign in"
    bgColor = "bg-blue-100"
    textColor = "text-blue-800"
    borderColor = "border-blue-200"
  }

  return (
    <div className={`${bgColor} ${borderColor} ${textColor} border px-4 py-2 text-sm font-medium text-center relative`}>
      {message}
      <button
        onClick={() => setShowBanner(false)}
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${textColor} hover:opacity-70 text-lg font-bold leading-none`}
        aria-label="Close banner"
      >
        ×
      </button>
    </div>
  )
}
