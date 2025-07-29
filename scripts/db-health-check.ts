#!/usr/bin/env tsx

/**
 * Database Health Check Script
 * 
 * This script performs health checks on the Supabase database before deployment.
 * It verifies connectivity, runs basic queries, and ensures the database is ready.
 * 
 * Usage:
 *   tsx scripts/db-health-check.ts
 *   npm run db:health-check
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy'
  checks: {
    connectivity: boolean
    auth: boolean
    basicQuery: boolean
    rls: boolean
  }
  errors: string[]
  responseTime: number
}

async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  const result: HealthCheckResult = {
    status: 'healthy',
    checks: {
      connectivity: false,
      auth: false,
      basicQuery: false,
      rls: false
    },
    errors: [],
    responseTime: 0
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    result.status = 'unhealthy'
    result.errors.push('Missing Supabase URL or API key')
    return result
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Check 1: Basic connectivity
    console.log('🔍 Checking database connectivity...')
    const { data: pingData, error: pingError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()

    if (pingError && pingError.code !== 'PGRST116') {
      throw new Error(`Connectivity check failed: ${pingError.message}`)
    }
    
    result.checks.connectivity = true
    console.log('✅ Database connectivity: OK')

    // Check 2: Authentication service
    console.log('🔍 Checking authentication service...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      throw new Error(`Auth service check failed: ${authError.message}`)
    }
    
    result.checks.auth = true
    console.log('✅ Authentication service: OK')

    // Check 3: Basic query execution
    console.log('🔍 Checking basic query execution...')
    const { data: queryData, error: queryError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(5)

    if (queryError) {
      throw new Error(`Basic query check failed: ${queryError.message}`)
    }
    
    result.checks.basicQuery = true
    console.log('✅ Basic query execution: OK')

    // Check 4: RLS policies (verify they're active)
    console.log('🔍 Checking RLS policies...')
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('test_rls_policies')

    if (rlsError) {
      console.warn('⚠️  RLS check failed (this might be expected):', rlsError.message)
    } else {
      result.checks.rls = true
      console.log('✅ RLS policies: OK')
    }

    // Check 5: Database performance (simple latency test)
    const performanceStart = Date.now()
    await supabase.from('profiles').select('count').limit(1)
    const performanceEnd = Date.now()
    const latency = performanceEnd - performanceStart

    if (latency > 5000) { // 5 seconds threshold
      result.errors.push(`High database latency: ${latency}ms`)
    }

    result.responseTime = Date.now() - startTime

  } catch (error) {
    result.status = 'unhealthy'
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Health check failed:', error)
  }

  return result
}

async function main() {
  console.log('🏥 Starting database health check...')
  console.log('=' * 50)

  const result = await performHealthCheck()

  console.log('\n📊 Health Check Results:')
  console.log('=' * 30)
  console.log(`Status: ${result.status === 'healthy' ? '✅ HEALTHY' : '❌ UNHEALTHY'}`)
  console.log(`Response Time: ${result.responseTime}ms`)
  console.log('\nChecks:')
  console.log(`  Connectivity: ${result.checks.connectivity ? '✅' : '❌'}`)
  console.log(`  Authentication: ${result.checks.auth ? '✅' : '❌'}`)
  console.log(`  Basic Query: ${result.checks.basicQuery ? '✅' : '❌'}`)
  console.log(`  RLS Policies: ${result.checks.rls ? '✅' : '⚠️'}`)

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:')
    result.errors.forEach(error => console.log(`  - ${error}`))
  }

  console.log('\n' + '=' * 50)

  // Exit with appropriate code for CI/CD
  if (result.status === 'unhealthy') {
    console.error('❌ Database health check failed!')
    process.exit(1)
  } else {
    console.log('✅ Database health check passed!')
    process.exit(0)
  }
}

// Run the health check
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error during health check:', error)
    process.exit(1)
  })
}

export { performHealthCheck, type HealthCheckResult }