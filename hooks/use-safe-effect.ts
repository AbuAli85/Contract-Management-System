"use client"

import { useEffect, useRef, useCallback } from 'react'

interface SafeEffectOptions {
  onError?: (error: Error) => void
  retryAttempts?: number
  retryDelay?: number
}

export function useSafeEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList = [],
  options: SafeEffectOptions = {}
) {
  const mountedRef = useRef(true)
  const cleanupRef = useRef<(() => void) | void>()
  const { onError, retryAttempts = 1, retryDelay = 100 } = options

  // Track component mount state
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // Call cleanup if it exists
      if (cleanupRef.current) {
        try {
          cleanupRef.current()
        } catch (error) {
          console.warn('Cleanup function failed:', error)
        }
      }
    }
  }, [])

  // Safe effect execution
  useEffect(() => {
    if (!mountedRef.current) return

    let attempt = 0
    const executeEffect = () => {
      try {
        if (!mountedRef.current) return

        // Execute the effect and store cleanup
        const cleanup = effect()
        cleanupRef.current = cleanup

        return true
      } catch (error) {
        attempt++
        console.warn(`Effect execution failed (attempt ${attempt}/${retryAttempts}):`, error)

        if (onError) {
          onError(error as Error)
        }

        if (attempt < retryAttempts) {
          // Retry after delay
          setTimeout(executeEffect, retryDelay * attempt)
          return false
        } else {
          console.error('Effect execution failed after all retries:', error)
          return false
        }
      }
    }

    executeEffect()

    // Cleanup function
    return () => {
      if (cleanupRef.current) {
        try {
          cleanupRef.current()
        } catch (error) {
          console.warn('Cleanup function failed:', error)
        }
        cleanupRef.current = undefined
      }
    }
  }, deps)
}

// Safe state setter that checks if component is mounted
export function useSafeState<T>(initialState: T) {
  const [state, setState] = React.useState<T>(initialState)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const safeSetState = useCallback((newState: T | ((prev: T) => T)) => {
    if (mountedRef.current) {
      setState(newState)
    }
  }, [])

  return [state, safeSetState] as const
}

// Safe callback that prevents execution if component is unmounted
export function useSafeCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
): T {
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return useCallback((...args: Parameters<T>) => {
    if (mountedRef.current) {
      return callback(...args)
    }
  }, [callback, ...deps]) as T
}

// Safe timeout that clears automatically on unmount
export function useSafeTimeout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        callback()
      }
    }, delay)
  }, [])

  const safeClearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return { safeSetTimeout, safeClearTimeout }
}

// Safe interval that clears automatically on unmount
export function useSafeInterval() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        callback()
      } else {
        // Clear interval if component unmounted
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, delay)
  }, [])

  const safeClearInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  return { safeSetInterval, safeClearInterval }
} 