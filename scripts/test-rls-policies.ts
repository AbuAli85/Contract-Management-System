#!/usr/bin/env tsx

/**
 * RLS Policy Testing Script
 * 
 * This script tests Row Level Security policies to ensure unauthorized access is blocked.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

interface TestResult {
  testName: string
  expectedResult: 'PASS' | 'FAIL'
  actualResult: 'PASS' | 'FAIL'
  error?: string
  details?: any
}

class RLSPolicyTester {
  private supabase: any
  private testResults: TestResult[] = []

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  private async runTest(
    testName: string,
    testFunction: () => Promise<any>,
    expectedResult: 'PASS' | 'FAIL'
  ): Promise<void> {
    try {
      await testFunction()
      
      this.testResults.push({
        testName,
        expectedResult,
        actualResult: 'PASS',
        details: 'Test completed successfully'
      })
    } catch (error: any) {
      this.testResults.push({
        testName,
        expectedResult,
        actualResult: 'FAIL',
        error: error.message,
        details: error
      })
    }
  }

  private async testUserProfileAccess(): Promise<void> {
    // Test that users can only access their own profile
    const { data: user } = await this.supabase.auth.getUser()
    
    if (!user.user) {
      throw new Error('No authenticated user found')
    }

    // Should be able to read own profile
    const { data: ownProfile, error: ownError } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single()

    if (ownError) {
      throw new Error(`Failed to read own profile: ${ownError.message}`)
    }

    // Should not be able to read other profiles
    const { data: otherProfiles, error: otherError } = await this.supabase
      .from('profiles')
      .select('*')
      .neq('id', user.user.id)
      .limit(1)

    if (!otherError && otherProfiles && otherProfiles.length > 0) {
      throw new Error('User was able to access other profiles')
    }
  }

  private async testPromoterAccess(): Promise<void> {
    // Test promoter access policies
    const { data: promoters, error } = await this.supabase
      .from('promoters')
      .select('*')
      .limit(5)

    if (error) {
      throw new Error(`Failed to access promoters: ${error.message}`)
    }

    // Test that we can read promoters (should be allowed for authenticated users)
    if (!promoters || promoters.length === 0) {
      console.log('No promoters found in database')
    }
  }

  private async testContractAccess(): Promise<void> {
    // Test contract access policies
    const { data: contracts, error } = await this.supabase
      .from('contracts')
      .select('*')
      .limit(5)

    if (error) {
      throw new Error(`Failed to access contracts: ${error.message}`)
    }

    // Test that we can read contracts (should be allowed for authenticated users)
    if (!contracts || contracts.length === 0) {
      console.log('No contracts found in database')
    }
  }

  private async testPartyAccess(): Promise<void> {
    // Test party access policies
    const { data: parties, error } = await this.supabase
      .from('parties')
      .select('*')
      .limit(5)

    if (error) {
      throw new Error(`Failed to access parties: ${error.message}`)
    }

    // Test that we can read parties (should be allowed for authenticated users)
    if (!parties || parties.length === 0) {
      console.log('No parties found in database')
    }
  }

  private async testUnauthorizedInsert(): Promise<void> {
    // Test that unauthorized users cannot insert data
    const testData = {
      name_en: 'Test Party',
      name_ar: 'طرف تجريبي',
      crn: 'TEST123456',
      type: 'Generic'
    }

    const { data, error } = await this.supabase
      .from('parties')
      .insert(testData)
      .select()

    // This should fail for regular users
    if (!error) {
      throw new Error('User was able to insert party data without proper permissions')
    }
  }

  private async testUnauthorizedUpdate(): Promise<void> {
    // Test that unauthorized users cannot update data
    const { data: parties } = await this.supabase
      .from('parties')
      .select('id, name_en')
      .limit(1)

    if (parties && parties.length > 0) {
      const { error } = await this.supabase
        .from('parties')
        .update({ name_en: 'Unauthorized Update' })
        .eq('id', parties[0].id)

      // This should fail for regular users
      if (!error) {
        throw new Error('User was able to update party data without proper permissions')
      }
    }
  }

  private async testUnauthorizedDelete(): Promise<void> {
    // Test that unauthorized users cannot delete data
    const { data: parties } = await this.supabase
      .from('parties')
      .select('id')
      .limit(1)

    if (parties && parties.length > 0) {
      const { error } = await this.supabase
        .from('parties')
        .delete()
        .eq('id', parties[0].id)

      // This should fail for regular users
      if (!error) {
        throw new Error('User was able to delete party data without proper permissions')
      }
    }
  }

  private async testSystemTableAccess(): Promise<void> {
    // Test that regular users cannot access system tables
    const { data: systemLogs, error } = await this.supabase
      .from('system_activity_log')
      .select('*')
      .limit(5)

    // This should fail for regular users
    if (!error) {
      throw new Error('User was able to access system activity logs')
    }
  }

  private async testEmailQueueAccess(): Promise<void> {
    // Test that regular users cannot access email queue
    const { data: emailQueue, error } = await this.supabase
      .from('email_queue')
      .select('*')
      .limit(5)

    // This should fail for regular users
    if (!error) {
      throw new Error('User was able to access email queue')
    }
  }

  private async testRLSPolicyVerification(): Promise<void> {
    // Test the RLS policy verification function
    const { data: policies, error } = await this.supabase
      .rpc('test_rls_policies')

    if (error) {
      throw new Error(`Failed to verify RLS policies: ${error.message}`)
    }

    if (!policies || policies.length === 0) {
      throw new Error('No RLS policies found')
    }

    console.log(`Found ${policies.length} active RLS policies`)
  }

  public async runAllTests(): Promise<void> {
    console.log('🔒 Starting RLS Policy Tests...\n')

    // Test authenticated user access
    await this.runTest(
      'User Profile Access Control',
      () => this.testUserProfileAccess(),
      'PASS'
    )

    await this.runTest(
      'Promoter Access Control',
      () => this.testPromoterAccess(),
      'PASS'
    )

    await this.runTest(
      'Contract Access Control',
      () => this.testContractAccess(),
      'PASS'
    )

    await this.runTest(
      'Party Access Control',
      () => this.testPartyAccess(),
      'PASS'
    )

    // Test unauthorized operations
    await this.runTest(
      'Unauthorized Insert Prevention',
      () => this.testUnauthorizedInsert(),
      'PASS'
    )

    await this.runTest(
      'Unauthorized Update Prevention',
      () => this.testUnauthorizedUpdate(),
      'PASS'
    )

    await this.runTest(
      'Unauthorized Delete Prevention',
      () => this.testUnauthorizedDelete(),
      'PASS'
    )

    // Test system table access
    await this.runTest(
      'System Table Access Control',
      () => this.testSystemTableAccess(),
      'PASS'
    )

    await this.runTest(
      'Email Queue Access Control',
      () => this.testEmailQueueAccess(),
      'PASS'
    )

    // Test RLS policy verification
    await this.runTest(
      'RLS Policy Verification',
      () => this.testRLSPolicyVerification(),
      'PASS'
    )

    this.printResults()
  }

  private printResults(): void {
    console.log('\n📊 RLS Policy Test Results')
    console.log('=' .repeat(60))

    const passed = this.testResults.filter(r => r.actualResult === 'PASS').length
    const failed = this.testResults.filter(r => r.actualResult === 'FAIL').length
    const total = this.testResults.length

    console.log(`Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

    console.log('\n📋 Detailed Results:')
    console.log('-'.repeat(60))

    this.testResults.forEach((result, index) => {
      const status = result.actualResult === 'PASS' ? '✅' : '❌'
      const expected = result.expectedResult === 'PASS' ? 'PASS' : 'FAIL'
      
      console.log(`${index + 1}. ${status} ${result.testName}`)
      console.log(`   Expected: ${expected}, Actual: ${result.actualResult}`)
      
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
      
      console.log('')
    })

    if (failed > 0) {
      console.log('⚠️  Some tests failed. Please review the RLS policies.')
      process.exit(1)
    } else {
      console.log('🎉 All RLS policy tests passed!')
    }
  }
}

// Run tests
if (require.main === module) {
  const tester = new RLSPolicyTester()
  tester.runAllTests()
}

export default RLSPolicyTester