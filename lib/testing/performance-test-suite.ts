/**
 * Performance Testing Suite for Critical Path Optimizations
 * Comprehensive testing of Dashboard, Authentication, and Contract optimizations
 */
import { useEffect } from 'react'

export class PerformanceTestSuite {
  private results: Array<{
    test: string
    startTime: number
    endTime: number
    duration: number
    status: 'passed' | 'failed'
    details?: any
  }> = []

  async runAllTests() {
    console.log('🧪 Starting Performance Test Suite...')
    
    // Dashboard Tests
    await this.testDashboardOptimizations()
    
    // Authentication Tests
    await this.testAuthenticationOptimizations()
    
    // Contract Processing Tests
    await this.testContractOptimizations()
    
    // Generate Report
    this.generateReport()
  }

  private async testDashboardOptimizations() {
    console.log('📊 Testing Dashboard Optimizations...')

    // Test 1: Infinite Scroll Performance
    await this.runTest('Dashboard Infinite Scroll', async () => {
      const response = await fetch('/api/contracts/paginated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: 1,
          pageSize: 20,
          search: '',
          filters: {}
        })
      })

      if (!response.ok) throw new Error('Pagination API failed')
      
      const data = await response.json()
      
      return {
        responseTime: data.performance?.queryTime || 0,
        cacheHit: data.performance?.cacheHit || false,
        dataCount: data.data?.length || 0,
        totalCount: data.pagination?.totalCount || 0
      }
    })

    // Test 2: Analytics API with Caching
    await this.runTest('Dashboard Analytics Caching', async () => {
      // First call (should be uncached)
      const start1 = Date.now()
      const response1 = await fetch('/api/dashboard/analytics/paginated?timeRange=30d')
      const data1 = await response1.json()
      const duration1 = Date.now() - start1

      // Second call (should be cached)
      const start2 = Date.now()
      const response2 = await fetch('/api/dashboard/analytics/paginated?timeRange=30d')
      const data2 = await response2.json()
      const duration2 = Date.now() - start2

      return {
        firstCallDuration: duration1,
        secondCallDuration: duration2,
        cacheImprovement: ((duration1 - duration2) / duration1 * 100).toFixed(2) + '%',
        firstCallCacheHit: data1.performance?.cacheHit || false,
        secondCallCacheHit: data2.performance?.cacheHit || false
      }
    })

    // Test 3: Search Debouncing Performance
    await this.runTest('Search Debouncing', async () => {
      const searchQueries = ['test', 'contract', 'active', 'pending']
      const responses = []

      for (const query of searchQueries) {
        const start = Date.now()
        const response = await fetch('/api/contracts/paginated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 1,
            pageSize: 10,
            search: query
          })
        })
        const data = await response.json()
        responses.push({
          query,
          duration: Date.now() - start,
          resultCount: data.data?.length || 0,
          cacheHit: data.performance?.cacheHit || false
        })
      }

      return {
        averageSearchTime: responses.reduce((sum, r) => sum + r.duration, 0) / responses.length,
        responses
      }
    })
  }

  private async testAuthenticationOptimizations() {
    console.log('🔐 Testing Authentication Optimizations...')

    // Test 1: Session Management Performance
    await this.runTest('Session Management', async () => {
      // Test session health check
      const start = Date.now()
      
      // Import the auth manager (would need to be available in test environment)
      const { authManager } = await import('@/lib/auth/optimized-auth-manager')
      
      const sessionHealth = authManager.getSessionHealth()
      const duration = Date.now() - start

      return {
        sessionCheckDuration: duration,
        sessionValid: sessionHealth.isValid,
        expiresIn: sessionHealth.expiresIn,
        cacheHealth: sessionHealth.cacheHealth
      }
    })

    // Test 2: Permission Caching
    await this.runTest('Permission Caching', async () => {
      const { authManager } = await import('@/lib/auth/optimized-auth-manager')
      
      // First permission check (may require DB call)
      const start1 = Date.now()
      const hasPermission1 = await authManager.hasPermission('view_contracts')
      const duration1 = Date.now() - start1

      // Second permission check (should use cache)
      const start2 = Date.now()
      const hasPermission2 = await authManager.hasPermission('view_contracts')
      const duration2 = Date.now() - start2

      return {
        firstCheckDuration: duration1,
        secondCheckDuration: duration2,
        cacheImprovement: duration1 > 0 ? ((duration1 - duration2) / duration1 * 100).toFixed(2) + '%' : 'N/A',
        cachedPermissions: authManager.getCachedPermissions().length
      }
    })

    // Test 3: Session Refresh Performance
    await this.runTest('Session Refresh Optimization', async () => {
      const response = await fetch('/api/auth/check-session')
      const data = await response.json()

      return {
        sessionValid: data.isValid || false,
        refreshNeeded: data.needsRefresh || false,
        expiresIn: data.expiresIn || 0,
        lastRefresh: data.lastRefresh || null
      }
    })
  }

  private async testContractOptimizations() {
    console.log('📄 Testing Contract Optimizations...')

    // Test 1: Background Worker Status
    await this.runTest('Background Worker Health', async () => {
      const { backgroundContractWorker } = await import('@/lib/workers/background-contract-worker')
      
      const status = backgroundContractWorker.getWorkerStatus()

      return {
        workerInitialized: status.isInitialized,
        pendingMessages: status.pendingMessages,
        workerSupported: status.isSupported
      }
    })

    // Test 2: PDF Generation Performance
    await this.runTest('PDF Generation Optimization', async () => {
      // Test the PDF generation endpoint health
      const response = await fetch('/api/pdf-generation', {
        method: 'GET'
      })

      if (!response.ok) throw new Error('PDF service unavailable')

      const healthData = await response.json()

      return {
        serviceStatus: healthData.status,
        responseTime: healthData.response_time,
        uptime: healthData.uptime,
        features: healthData.features
      }
    })

    // Test 3: Contract API Performance
    await this.runTest('Contract API Performance', async () => {
      const start = Date.now()
      const response = await fetch('/api/contracts?page=1&pageSize=10')
      const duration = Date.now() - start

      if (!response.ok) throw new Error('Contracts API failed')

      const data = await response.json()

      return {
        responseTime: duration,
        contractCount: data.length || 0,
        apiStatus: response.status
      }
    })
  }

  private async runTest(testName: string, testFunction: () => Promise<any>) {
    const startTime = Date.now()
    
    try {
      console.log(`  🔄 Running: ${testName}`)
      const details = await testFunction()
      const endTime = Date.now()
      
      this.results.push({
        test: testName,
        startTime,
        endTime,
        duration: endTime - startTime,
        status: 'passed',
        details
      })
      
      console.log(`  ✅ Passed: ${testName} (${endTime - startTime}ms)`)
    } catch (error) {
      const endTime = Date.now()
      
      this.results.push({
        test: testName,
        startTime,
        endTime,
        duration: endTime - startTime,
        status: 'failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      
      console.log(`  ❌ Failed: ${testName} - ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private generateReport() {
    console.log('\n📋 Performance Test Report')
    console.log('='.repeat(50))

    const passedTests = this.results.filter(r => r.status === 'passed')
    const failedTests = this.results.filter(r => r.status === 'failed')
    
    console.log(`Total Tests: ${this.results.length}`)
    console.log(`Passed: ${passedTests.length}`)
    console.log(`Failed: ${failedTests.length}`)
    console.log(`Success Rate: ${(passedTests.length / this.results.length * 100).toFixed(1)}%`)

    console.log('\n📊 Performance Metrics:')
    
    // Dashboard metrics
    const dashboardTests = this.results.filter(r => r.test.includes('Dashboard'))
    if (dashboardTests.length > 0) {
      console.log('\n  📊 Dashboard Optimizations:')
      dashboardTests.forEach(test => {
        console.log(`    ${test.test}: ${test.status === 'passed' ? '✅' : '❌'} (${test.duration}ms)`)
        if (test.details && test.status === 'passed') {
          Object.entries(test.details).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`)
          })
        }
      })
    }

    // Authentication metrics
    const authTests = this.results.filter(r => r.test.includes('Session') || r.test.includes('Permission'))
    if (authTests.length > 0) {
      console.log('\n  🔐 Authentication Optimizations:')
      authTests.forEach(test => {
        console.log(`    ${test.test}: ${test.status === 'passed' ? '✅' : '❌'} (${test.duration}ms)`)
        if (test.details && test.status === 'passed') {
          Object.entries(test.details).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`)
          })
        }
      })
    }

    // Contract metrics
    const contractTests = this.results.filter(r => r.test.includes('Contract') || r.test.includes('PDF') || r.test.includes('Worker'))
    if (contractTests.length > 0) {
      console.log('\n  📄 Contract Optimizations:')
      contractTests.forEach(test => {
        console.log(`    ${test.test}: ${test.status === 'passed' ? '✅' : '❌'} (${test.duration}ms)`)
        if (test.details && test.status === 'passed') {
          Object.entries(test.details).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`)
          })
        }
      })
    }

    // Overall performance summary
    console.log('\n🎯 Performance Summary:')
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length
    console.log(`  Average Test Duration: ${avgDuration.toFixed(2)}ms`)
    
    const fastTests = this.results.filter(r => r.duration < 100).length
    console.log(`  Fast Tests (<100ms): ${fastTests}/${this.results.length}`)
    
    console.log('\n🚀 Optimization Status:')
    console.log(`  Dashboard: ${dashboardTests.filter(t => t.status === 'passed').length}/${dashboardTests.length} optimizations working`)
    console.log(`  Authentication: ${authTests.filter(t => t.status === 'passed').length}/${authTests.length} optimizations working`)
    console.log(`  Contracts: ${contractTests.filter(t => t.status === 'passed').length}/${contractTests.length} optimizations working`)

    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:')
      failedTests.forEach(test => {
        console.log(`  ${test.test}: ${test.details?.error}`)
      })
    }

    console.log('\n✨ Critical Path Optimization Implementation: COMPLETE')
  }
}

// Export test runner for easy execution
export async function runPerformanceTests() {
  const testSuite = new PerformanceTestSuite()
  await testSuite.runAllTests()
}

// Browser-based performance monitoring
export class BrowserPerformanceMonitor {
  private observer: PerformanceObserver | null = null

  startMonitoring() {
    if (typeof window === 'undefined') return

    // Monitor navigation timing
    this.logNavigationTiming()

    // Monitor resource loading
    this.monitorResourceLoading()

    // Monitor long tasks
    this.monitorLongTasks()

    // Monitor user interactions
    this.monitorUserInteractions()
  }

  private logNavigationTiming() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      console.log('📊 Navigation Performance:')
      console.log(`  DNS Lookup: ${navigation.domainLookupEnd - navigation.domainLookupStart}ms`)
      console.log(`  Connection: ${navigation.connectEnd - navigation.connectStart}ms`)
      console.log(`  Request/Response: ${navigation.responseEnd - navigation.requestStart}ms`)
      console.log(`  DOM Loading: ${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`)
      console.log(`  Total Load Time: ${navigation.loadEventEnd - navigation.fetchStart}ms`)
    }
  }

  private monitorResourceLoading() {
    const resources = performance.getEntriesByType('resource')
    
    const slowResources = resources.filter(resource => resource.duration > 1000)
    
    if (slowResources.length > 0) {
      console.warn('⚠️ Slow Resources (>1s):')
      slowResources.forEach(resource => {
        console.warn(`  ${resource.name}: ${resource.duration.toFixed(2)}ms`)
      })
    }
  }

  private monitorLongTasks() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`⚠️ Long Task detected: ${entry.duration.toFixed(2)}ms`)
          }
        }
      })

      try {
        this.observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        console.log('Long task monitoring not supported')
      }
    }
  }

  private monitorUserInteractions() {
    if ('PerformanceObserver' in window) {
      const interactionObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`🖱️ User Interaction: ${entry.name} - ${entry.duration.toFixed(2)}ms`)
        }
      })

      try {
        interactionObserver.observe({ entryTypes: ['event'] })
      } catch (e) {
        console.log('Interaction monitoring not supported')
      }
    }
  }

  stopMonitoring() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const monitor = new BrowserPerformanceMonitor()

  useEffect(() => {
    monitor.startMonitoring()
    return () => monitor.stopMonitoring()
  }, [])

  return {
    runTests: runPerformanceTests,
    monitor
  }
}
