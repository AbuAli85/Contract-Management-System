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

    const results: any = {
      currentUser: {
        id: user.id,
        email: user.email
      },
      tables: {},
      errors: []
    }

    // Test users table
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1)
      
      results.tables.users = {
        exists: !usersError,
        error: usersError ? {
          code: usersError.code,
          message: usersError.message,
          details: usersError.details,
          hint: usersError.hint
        } : null,
        sampleData: users
      }
    } catch (error) {
      results.tables.users = {
        exists: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'Exception'
        },
        sampleData: null
      }
    }

    // Test profiles table
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      results.tables.profiles = {
        exists: !profilesError,
        error: profilesError ? {
          code: profilesError.code,
          message: profilesError.message,
          details: profilesError.details,
          hint: profilesError.hint
        } : null,
        sampleData: profiles
      }
    } catch (error) {
      results.tables.profiles = {
        exists: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'Exception'
        },
        sampleData: null
      }
    }

    // Test app_users table
    try {
      const { data: appUsers, error: appUsersError } = await supabase
        .from('app_users')
        .select('*')
        .limit(1)
      
      results.tables.app_users = {
        exists: !appUsersError,
        error: appUsersError ? {
          code: appUsersError.code,
          message: appUsersError.message,
          details: appUsersError.details,
          hint: appUsersError.hint
        } : null,
        sampleData: appUsers
      }
    } catch (error) {
      results.tables.app_users = {
        exists: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'Exception'
        },
        sampleData: null
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error('Debug tables error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 