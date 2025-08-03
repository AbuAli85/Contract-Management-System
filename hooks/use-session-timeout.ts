import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-service'
import { useToast } from '@/hooks/use-toast'

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number
  warningMinutes?: number
  onTimeout?: () => void
}

export function useSessionTimeout({
  timeoutMinutes = 5,
  warningMinutes = 1,
  onTimeout
}: UseSessionTimeoutOptions = {}) {
  const { signOut } = useAuth()
  const { toast } = useToast()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isWarningShownRef = useRef<boolean>(false)

  // Reset timers on user activity
  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now()
    isWarningShownRef.current = false

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    // Set warning timer
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000
    warningRef.current = setTimeout(() => {
      isWarningShownRef.current = true
      toast({
        title: "Session Expiring Soon",
        description: `Your session will expire in ${warningMinutes} minute${warningMinutes > 1 ? 's' : ''}. Click anywhere to extend your session.`,
        variant: "warning",
        duration: 10000, // 10 seconds
      })
    }, warningTime)

    // Set logout timer
    const logoutTime = timeoutMinutes * 60 * 1000
    timeoutRef.current = setTimeout(() => {
      toast({
        title: "Session Expired",
        description: "You have been automatically logged out due to inactivity.",
        variant: "destructive",
      })
      
      if (onTimeout) {
        onTimeout()
      } else {
        signOut()
      }
    }, logoutTime)
  }, [timeoutMinutes, warningMinutes, signOut, toast, onTimeout])

  // Handle user activity
  const handleActivity = useCallback(() => {
    if (isWarningShownRef.current) {
      // User clicked after warning, reset everything
      isWarningShownRef.current = false
      toast({
        title: "Session Extended",
        description: "Your session has been extended.",
        duration: 3000,
      })
    }
    resetTimers()
  }, [resetTimers, toast])

  // Set up activity listeners
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ]

    const handleUserActivity = () => {
      handleActivity()
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    // Initial timer setup
    resetTimers()

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }
    }
  }, [handleActivity, resetTimers])

  // Return functions for manual control
  return {
    resetTimers,
    handleActivity,
    getTimeRemaining: () => {
      const timeElapsed = Date.now() - lastActivityRef.current
      const timeRemaining = (timeoutMinutes * 60 * 1000) - timeElapsed
      return Math.max(0, Math.floor(timeRemaining / 1000))
    }
  }
} 