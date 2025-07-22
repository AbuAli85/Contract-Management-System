import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST SUPABASE START ===')
    
    const supabase = await createClient()
    console.log('Supabase client created successfully')
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication error',
        details: authError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found')
      return NextResponse.json({ 
        success: false, 
        error: 'No authenticated user' 
      }, { status: 401 })
    }

    console.log('User authenticated:', { id: user.id, email: user.email })

    // Test basic database connection
    let dbTestResult = 'unknown'
    let dbError = null
    
    try {
      // Try to access any table to test connection
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        dbTestResult = 'users_table_error'
        dbError = error
      } else {
        dbTestResult = 'users_table_works'
      }
    } catch (error) {
      dbTestResult = 'users_table_exception'
      dbError = error
    }

    // Try profiles table if users failed
    if (dbTestResult.includes('error') || dbTestResult.includes('exception')) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
        
        if (error) {
          dbTestResult = 'profiles_table_error'
          dbError = error
        } else {
          dbTestResult = 'profiles_table_works'
        }
      } catch (error) {
        dbTestResult = 'profiles_table_exception'
        dbError = error
      }
    }

    console.log('=== TEST SUPABASE SUCCESS ===')
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      databaseTest: {
        result: dbTestResult,
        error: dbError ? {
          message: dbError instanceof Error ? dbError.message : 'Unknown error',
          code: (dbError as any)?.code || 'unknown',
          details: (dbError as any)?.details || null
        } : null
      },
      message: 'Supabase connection test completed'
    })
    
  } catch (error) {
    console.error('=== TEST SUPABASE ERROR ===')
    console.error('Error in test-supabase:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 