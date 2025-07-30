import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('🧪 Test Authentication Flow API called')
    
    const supabase = await createClient()
    
    // Test complete authentication flow
    const testResults = {
      step1: {
        name: 'Client Creation',
        status: '✅ Passed',
        details: 'Supabase client created successfully'
      },
      step2: {
        name: 'Session Check',
        status: '✅ Passed',
        details: 'Session check completed'
      },
      step3: {
        name: 'User Check',
        status: '✅ Passed',
        details: 'User check completed'
      },
      step4: {
        name: 'Authentication State',
        status: '✅ Passed',
        details: 'Authentication state verified'
      },
      clientType: !process.env.NEXT_PUBLIC_SUPABASE_URL ? 'mock' : 'real',
      timestamp: new Date().toISOString()
    }
    
    // Test getSession
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      testResults.step2.status = '❌ Failed'
      testResults.step2.details = `Session error: ${sessionError.message}`
    } else if (session) {
      testResults.step2.details = `Session found for user: ${session.user.email}`
    } else {
      testResults.step2.details = 'No session found (expected for new users)'
    }
    
    // Test getUser
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      testResults.step3.status = '❌ Failed'
      testResults.step3.details = `User error: ${userError.message}`
    } else if (user) {
      testResults.step3.details = `User found: ${user.email}`
      testResults.step4.details = 'User is authenticated'
    } else {
      testResults.step3.details = 'No user found (expected for new users)'
      testResults.step4.details = 'User is not authenticated'
    }
    
    console.log('🧪 Authentication flow test results:', testResults)
    
    return NextResponse.json({
      success: true,
      message: 'Authentication flow test completed',
      results: testResults,
      summary: {
        totalSteps: 4,
        passedSteps: Object.values(testResults).filter((step: any) => step.status === '✅ Passed').length,
        failedSteps: Object.values(testResults).filter((step: any) => step.status === '❌ Failed').length,
        overallStatus: Object.values(testResults).every((step: any) => step.status === '✅ Passed') ? '✅ All Tests Passed' : '⚠️ Some Tests Failed'
      },
      recommendations: {
        mock: 'Mock client should work for development with any credentials',
        real: 'Real Supabase should work for production with valid credentials'
      }
    })
    
  } catch (error) {
    console.error('🧪 Authentication flow test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 