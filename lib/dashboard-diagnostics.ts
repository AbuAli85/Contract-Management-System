/**
 * Dashboard Diagnostics Tool
 * This helps diagnose why the dashboard is not showing data
 */

export interface DashboardDiagnosticResult {
  success: boolean
  endpoint: string
  data?: any
  error?: string
  responseTime?: number
}

export interface DashboardDiagnosticSummary {
  totalTests: number
  passedTests: number
  failedTests: number
  results: DashboardDiagnosticResult[]
  summary: string
}

/**
 * Test a single API endpoint
 */
async function testEndpoint(endpoint: string): Promise<DashboardDiagnosticResult> {
  const startTime = Date.now()
  
  try {
    console.log(`🔍 Testing endpoint: ${endpoint}`)
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    
    const responseTime = Date.now() - startTime
    
    if (!response.ok) {
      return {
        success: false,
        endpoint,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime
      }
    }
    
    const data = await response.json()
    
    return {
      success: true,
      endpoint,
      data,
      responseTime
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    }
  }
}

/**
 * Run comprehensive dashboard diagnostics
 */
export async function runDashboardDiagnostics(): Promise<DashboardDiagnosticSummary> {
  console.log('🚀 Starting Dashboard Diagnostics...')
  
  const endpoints = [
    '/api/dashboard/stats',
    '/api/dashboard/notifications',
    '/api/dashboard/activities',
    '/api/health'
  ]
  
  const results: DashboardDiagnosticResult[] = []
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint)
    results.push(result)
    
    if (result.success) {
      console.log(`✅ ${endpoint}: Success (${result.responseTime}ms)`)
      console.log('📊 Data:', result.data)
    } else {
      console.error(`❌ ${endpoint}: Failed - ${result.error}`)
    }
  }
  
  // Test database connectivity through a simple query
  try {
    console.log('🔍 Testing database connectivity...')
    const dbTest = await testEndpoint('/api/dashboard/stats')
    results.push({
      ...dbTest,
      endpoint: 'Database Connectivity'
    })
  } catch (error) {
    results.push({
      success: false,
      endpoint: 'Database Connectivity',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  // Calculate summary
  const passedTests = results.filter(r => r.success).length
  const failedTests = results.filter(r => !r.success).length
  
  let summary = ''
  if (failedTests === 0) {
    summary = '🎉 All tests passed! Dashboard should be working correctly.'
  } else if (passedTests === 0) {
    summary = '🚨 All tests failed! There is a major issue with the dashboard.'
  } else {
    summary = `⚠️ ${passedTests} tests passed, ${failedTests} tests failed. Some dashboard features may not work.`
  }
  
  const diagnosticSummary: DashboardDiagnosticSummary = {
    totalTests: results.length,
    passedTests,
    failedTests,
    results,
    summary
  }
  
  console.log('📋 Diagnostic Summary:', diagnosticSummary)
  
  return diagnosticSummary
}

/**
 * Quick health check for dashboard
 */
export async function quickDashboardHealthCheck(): Promise<boolean> {
  try {
    const response = await fetch('/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    if (!response.ok) {
      console.error('❌ Dashboard health check failed:', response.status, response.statusText)
      return false
    }
    
    const data = await response.json()
    
    // Check if we got meaningful data
    if (data && typeof data === 'object') {
      console.log('✅ Dashboard health check passed')
      return true
    } else {
      console.error('❌ Dashboard health check failed: Invalid data format')
      return false
    }
    
  } catch (error) {
    console.error('❌ Dashboard health check failed:', error)
    return false
  }
}

/**
 * Test specific dashboard data points
 */
export async function testDashboardDataPoints(): Promise<{
  stats: any
  notifications: any
  activities: any
  errors: string[]
}> {
  const errors: string[] = []
  let stats = null
  let notifications = null
  let activities = null
  
  try {
    // Test stats endpoint
    const statsResponse = await fetch('/api/dashboard/stats')
    if (statsResponse.ok) {
      stats = await statsResponse.json()
      console.log('📊 Stats data:', stats)
    } else {
      errors.push(`Stats API failed: ${statsResponse.status}`)
    }
  } catch (error) {
    errors.push(`Stats API error: ${error}`)
  }
  
  try {
    // Test notifications endpoint
    const notificationsResponse = await fetch('/api/dashboard/notifications')
    if (notificationsResponse.ok) {
      notifications = await notificationsResponse.json()
      console.log('🔔 Notifications data:', notifications)
    } else {
      errors.push(`Notifications API failed: ${notificationsResponse.status}`)
    }
  } catch (error) {
    errors.push(`Notifications API error: ${error}`)
  }
  
  try {
    // Test activities endpoint
    const activitiesResponse = await fetch('/api/dashboard/activities')
    if (activitiesResponse.ok) {
      activities = await activitiesResponse.json()
      console.log('📈 Activities data:', activities)
    } else {
      errors.push(`Activities API failed: ${activitiesResponse.status}`)
    }
  } catch (error) {
    errors.push(`Activities API error: ${error}`)
  }
  
  return { stats, notifications, activities, errors }
} 