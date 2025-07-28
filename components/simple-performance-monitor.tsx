"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Activity, Zap, Clock, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleMetrics {
  loadTime: number | null
  memoryUsage: number | null
  renderCount: number
  lastRenderTime: number
  bundleSize: number | null
}

interface SimplePerformanceMonitorProps {
  className?: string
  showDetails?: boolean
}

export function SimplePerformanceMonitor({ className, showDetails = false }: SimplePerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<SimpleMetrics>({
    loadTime: null,
    memoryUsage: null,
    renderCount: 0,
    lastRenderTime: 0,
    bundleSize: null
  })

  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(showDetails)

  // Measure page load time
  const measureLoadTime = useCallback(() => {
    if (typeof window === 'undefined') return

    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      const loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart
      setMetrics(prev => ({ ...prev, loadTime }))
    }
  }, [])

  // Measure memory usage (if available)
  const measureMemory = useCallback(() => {
    if (typeof window === 'undefined') return

    // Check if memory API is available
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
      }))
    }
  }, [])

  // Measure bundle size (approximation)
  const measureBundleSize = useCallback(() => {
    if (typeof window === 'undefined') return

    const resources = performance.getEntriesByType('resource')
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') || resource.name.includes('chunk')
    )
    
    const totalSize = jsResources.reduce((sum, resource) => {
      return sum + ((resource as PerformanceResourceTiming).transferSize || 0)
    }, 0)

    setMetrics(prev => ({
      ...prev,
      bundleSize: totalSize / 1024 / 1024 // Convert to MB
    }))
  }, [])

  // Track render performance
  const trackRender = useCallback(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      setMetrics(prev => ({
        ...prev,
        renderCount: prev.renderCount + 1,
        lastRenderTime: renderTime
      }))
    }
  }, [])

  // Refresh metrics
  const refreshMetrics = useCallback(() => {
    measureLoadTime()
    measureMemory()
    measureBundleSize()
  }, [measureLoadTime, measureMemory, measureBundleSize])

  useEffect(() => {
    // Initial measurement
    measureLoadTime()
    measureMemory()
    measureBundleSize()

    // Set up periodic measurements
    const interval = setInterval(() => {
      measureMemory()
    }, 5000) // Check memory every 5 seconds

    // Set up render tracking
    const cleanup = trackRender()

    return () => {
      clearInterval(interval)
      cleanup()
    }
  }, [measureLoadTime, measureMemory, measureBundleSize, trackRender])

  // Auto-hide after 10 seconds unless expanded
  useEffect(() => {
    if (!isExpanded) {
      const timer = setTimeout(() => setIsVisible(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [isExpanded])

  // Show on first load
  useEffect(() => {
    setIsVisible(true)
  }, [])

  const getPerformanceScore = () => {
    let score = 100

    // Deduct points for poor performance
    if (metrics.loadTime && metrics.loadTime > 3000) score -= 30
    if (metrics.bundleSize && metrics.bundleSize > 2) score -= 20
    if (metrics.memoryUsage && metrics.memoryUsage > 100) score -= 20
    if (metrics.lastRenderTime > 16) score -= 30 // 60fps threshold

    return Math.max(0, score)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getMetricStatus = (value: number | null, good: number, warning: number) => {
    if (value === null) return "unknown"
    if (value <= good) return "good"
    if (value <= warning) return "warning"
    return "poor"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "text-green-600"
      case "warning": return "text-yellow-600"
      case "poor": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  if (!isVisible) return null

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", getScoreColor(getPerformanceScore()))}>
                {getPerformanceScore()}/100
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? "−" : "+"}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-3">
            {/* Performance Metrics */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Performance</h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Load Time:</span>
                  <span className={getStatusColor(getMetricStatus(metrics.loadTime, 2000, 4000))}>
                    {metrics.loadTime ? `${Math.round(metrics.loadTime)}ms` : "—"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Bundle Size:</span>
                  <span className={getStatusColor(getMetricStatus(metrics.bundleSize, 1, 2))}>
                    {metrics.bundleSize ? `${metrics.bundleSize.toFixed(1)}MB` : "—"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Memory:</span>
                  <span className={getStatusColor(getMetricStatus(metrics.memoryUsage, 50, 100))}>
                    {metrics.memoryUsage ? `${Math.round(metrics.memoryUsage)}MB` : "—"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Render Time:</span>
                  <span className={getStatusColor(getMetricStatus(metrics.lastRenderTime, 16, 33))}>
                    {metrics.lastRenderTime ? `${Math.round(metrics.lastRenderTime)}ms` : "—"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Renders:</span>
                  <span>{metrics.renderCount}</span>
                </div>
              </div>
            </div>

            {/* Performance Tips */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Tips</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                {metrics.loadTime && metrics.loadTime > 3000 && (
                  <div>⚠️ Load time is slow. Consider optimizing images and reducing bundle size.</div>
                )}
                {metrics.bundleSize && metrics.bundleSize > 2 && (
                  <div>⚠️ Bundle size is large. Use dynamic imports for heavy components.</div>
                )}
                {metrics.memoryUsage && metrics.memoryUsage > 100 && (
                  <div>⚠️ High memory usage. Check for memory leaks.</div>
                )}
                {metrics.lastRenderTime > 16 && (
                  <div>⚠️ Render time exceeds 60fps threshold. Consider React.memo().</div>
                )}
                {getPerformanceScore() >= 90 && (
                  <div>✅ Performance looks good!</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshMetrics}
                className="flex-1 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="text-xs"
              >
                Hide
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// Hook for easy integration
export function useSimplePerformanceMonitor() {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    // Enable in development or when explicitly requested
    setIsEnabled(process.env.NODE_ENV === 'development' || 
                localStorage.getItem('performance-monitor') === 'true')
  }, [])

  return { isEnabled, setIsEnabled }
} 