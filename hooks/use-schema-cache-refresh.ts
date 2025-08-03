import { useState, useEffect } from 'react'
import { refreshSupabaseSchemaCache, checkSchemaCacheStatus, refreshSchemaCacheWithRetry } from '@/lib/supabase/refresh-schema-cache'

export function useSchemaCacheRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'checking' | 'refreshing' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const checkStatus = async () => {
    try {
      setStatus('checking')
      setError(null)
      
      const result = await checkSchemaCacheStatus()
      
      if (result.status === 'ok') {
        setStatus('success')
        return { needsRefresh: false, status: 'ok' }
      } else {
        setStatus('error')
        setError(result.error || 'Schema cache issue detected')
        return { needsRefresh: true, status: 'error', error: result.error }
      }
    } catch (err) {
      setStatus('error')
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { needsRefresh: true, status: 'error', error: errorMessage }
    }
  }

  const refreshCache = async (useRetry = true) => {
    try {
      setIsRefreshing(true)
      setStatus('refreshing')
      setError(null)
      
      const result = useRetry 
        ? await refreshSchemaCacheWithRetry()
        : await refreshSupabaseSchemaCache()
      
      if (result.success) {
        setStatus('success')
        setLastRefresh(new Date())
        return { success: true, data: result.data }
      } else {
        setStatus('error')
        const errorMessage = result.error?.message || result.error || 'Failed to refresh schema cache'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      setStatus('error')
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsRefreshing(false)
    }
  }

  const refreshCacheWithRetry = async () => {
    return refreshCache(true)
  }

  const refreshCacheSimple = async () => {
    return refreshCache(false)
  }

  // Auto-check status on mount
  useEffect(() => {
    checkStatus()
  }, [])

  return {
    // State
    isRefreshing,
    status,
    error,
    lastRefresh,
    
    // Actions
    checkStatus,
    refreshCache: refreshCacheWithRetry,
    refreshCacheSimple,
    
    // Computed
    needsRefresh: status === 'error',
    isWorking: status === 'success',
    isLoading: status === 'checking' || status === 'refreshing'
  }
} 