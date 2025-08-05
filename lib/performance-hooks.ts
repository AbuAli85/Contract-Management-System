import { useCallback, useRef } from 'react'

/**
 * Custom debounce hook for performance optimization
 * Prevents excessive function calls that block UI updates
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }) as T,
    [callback, delay]
  )
}

/**
 * Optimized number input handler to reduce INP issues
 * Debounces form updates while maintaining responsive UI
 */
export function useOptimizedNumberInput() {
  const debouncedUpdate = useDebounce(
    (value: string, onChange: (val: number | undefined) => void) => {
      const numValue = value ? Number(value) : undefined
      onChange(isNaN(numValue!) ? undefined : numValue)
    },
    250 // 250ms debounce - good balance between responsiveness and performance
  )

  const createNumberChangeHandler = useCallback(
    (onChange: (val: number | undefined) => void) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Use debounced update to prevent UI blocking
        debouncedUpdate(value, onChange)
      },
    [debouncedUpdate]
  )

  return createNumberChangeHandler
}
