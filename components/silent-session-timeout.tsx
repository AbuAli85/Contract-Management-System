"use client"

import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { useAuth } from "@/lib/auth-service"

interface SilentSessionTimeoutProps {
  timeoutMinutes?: number
  enableLogging?: boolean
}

/**
 * Silent Session Timeout Component
 * 
 * This component provides invisible session timeout functionality.
 * It automatically logs out users after the specified timeout period
 * without showing any warnings or dialogs.
 * 
 * Usage: Add this component to any layout or page where you want
 * silent session timeout protection.
 */
export function SilentSessionTimeout({ 
  timeoutMinutes = 5,
  enableLogging = false 
}: SilentSessionTimeoutProps) {
  const { user } = useAuth()

  // Only activate session timeout for authenticated users
  useSessionTimeout({
    timeoutMinutes,
    enableLogging,
    silent: true
  })

  // This component renders nothing - it's purely functional
  return null
}
