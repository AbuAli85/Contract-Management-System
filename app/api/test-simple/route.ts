import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test basic database connection
    let testResult = 'unknown'
    let testError = null
    
    try {
      // Try a simple query to any table
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        testResult = 'users_table_error'
        testError = error
      } else {
        testResult = 'users_table_works'
      }
    } catch (error) {
      testResult = 'users_table_exception'
      testError = error
    }

    // Try profiles table if users failed
    if (testResult.includes('error') || testResult.includes('exception')) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
        
        if (error) {
          testResult = 'profiles_table_error'
          testError = error
        } else {
          testResult = 'profiles_table_works'
        }
      } catch (error) {
        testResult = 'profiles_table_exception'
        testError = error
      }
    }

    return NextResponse.json({
      success: true,
      currentUser: {
        id: user.id,
        email: user.email
      },
      testResult,
      testError: testError ? {
        message: (testError as any).message || 'Unknown error',
        code: (testError as any).code || 'unknown',
        details: (testError as any).details || null
      } : null,
      message: 'Simple database test completed'
    })
  } catch (error) {
    console.error('Simple test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 