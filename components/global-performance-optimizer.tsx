'use client'

import { useEffect, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic imports for heavy components with better loading states
export const DynamicComponents = {
  // Dashboard components
  DashboardContent: dynamic(() => import('./dashboard/dashboard-content'), {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }),
  
  // Contract components
  ContractsTable: dynamic(() => import('./contracts/ContractsTable'), {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }),

  // User management components
  UserManagementDashboard: dynamic(() => import('./user-management/user-management-dashboard').then(mod => ({ default: mod.UserManagementDashboard })), {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }),
}

// Simplified global performance optimizer
export function GlobalPerformanceOptimizer() {
  const [isOptimized, setIsOptimized] = useState(false)

  // Basic image optimization
  const optimizeImages = useCallback(() => {
    if (typeof window === 'undefined') return

    const images = document.querySelectorAll('img:not([data-optimized])')
    images.forEach(img => {
      const imageElement = img as HTMLImageElement
      if (!imageElement.hasAttribute('loading')) {
        imageElement.loading = 'lazy'
      }
      if (!imageElement.hasAttribute('decoding')) {
        imageElement.decoding = 'async'
      }
      imageElement.setAttribute('data-optimized', 'true')
    })
  }, [])

  // Basic network optimization
  const optimizeNetwork = useCallback(() => {
    if (typeof window === 'undefined') return

    // Simple fetch optimization
    const originalFetch = window.fetch
    window.fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : input instanceof URL
              ? input.toString()
              : "";
      
      // Add cache headers for static resources
      if (init?.method === 'GET' && (url.includes('/api/') || url.includes('/static/'))) {
        init = {
          ...init,
          cache: 'no-store',
        }
      }
      
      return originalFetch(input, init)
    }
  }, [])

  // Initialize optimizations
  useEffect(() => {
    const initOptimizations = async () => {
      // Run optimizations in parallel
      await Promise.all([
        optimizeImages(),
        optimizeNetwork()
      ])

      // Run image optimization after initial render
      setTimeout(() => {
        optimizeImages()
      }, 100)

      setIsOptimized(true)
    }

    initOptimizations()
  }, [optimizeImages, optimizeNetwork])

  return null
}

// Simplified performance monitoring
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    memoryUsage: 0,
    networkRequests: 0
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const memory = (performance as any).memory
      
      setMetrics({
        loadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
        memoryUsage: memory?.usedJSHeapSize || 0,
        networkRequests: performance.getEntriesByType('resource').length
      })
    }

    // Update metrics after page load
    if (document.readyState === 'complete') {
      updateMetrics()
    } else {
      window.addEventListener('load', updateMetrics)
      return () => window.removeEventListener('load', updateMetrics)
    }
  }, [])

  return metrics
} 