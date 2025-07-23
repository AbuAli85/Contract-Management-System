import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST ROLE SYSTEM START ===')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        test: 'auth_failed'
      }, { status: 401 })
    }

    console.log('✅ User authenticated:', { id: user.id, email: user.email })

    // Test all role sources
    const roleTests: any = {
      users: { found: false, role: null, error: null },
      profiles: { found: false, role: null, error: null },
      app_users: { found: false, role: null, error: null }
    }

    // Test users table
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!usersError && usersData?.role) {
        roleTests.users = { found: true, role: usersData.role, error: null }
        console.log('✅ Users table test: PASSED - role found:', usersData.role)
      } else {
        roleTests.users = { found: false, role: null, error: usersError?.message || 'No role found' }
        console.log('❌ Users table test: FAILED -', usersError?.message || 'No role found')
      }
    } catch (error) {
      roleTests.users = { found: false, role: null, error: error instanceof Error ? error.message : 'Unknown error' }
      console.log('❌ Users table test: ERROR -', error)
    }

    // Test profiles table
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!profilesError && profilesData?.role) {
        roleTests.profiles = { found: true, role: profilesData.role, error: null }
        console.log('✅ Profiles table test: PASSED - role found:', profilesData.role)
      } else {
        roleTests.profiles = { found: false, role: null, error: profilesError?.message || 'No role found' }
        console.log('❌ Profiles table test: FAILED -', profilesError?.message || 'No role found')
      }
    } catch (error) {
      roleTests.profiles = { found: false, role: null, error: error instanceof Error ? error.message : 'Unknown error' }
      console.log('❌ Profiles table test: ERROR -', error)
    }

    // Test app_users table
    try {
      const { data: appUsersData, error: appUsersError } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!appUsersError && appUsersData?.role) {
        roleTests.app_users = { found: true, role: appUsersData.role, error: null }
        console.log('✅ App_users table test: PASSED - role found:', appUsersData.role)
      } else {
        roleTests.app_users = { found: false, role: null, error: appUsersError?.message || 'No role found' }
        console.log('❌ App_users table test: FAILED -', appUsersError?.message || 'No role found')
      }
    } catch (error) {
      roleTests.app_users = { found: false, role: null, error: error instanceof Error ? error.message : 'Unknown error' }
      console.log('❌ App_users table test: ERROR -', error)
    }

    // Determine final role
    let finalRole = 'user'
    let roleSource = 'default'
    
    if (roleTests.users.found) {
      finalRole = roleTests.users.role!
      roleSource = 'users'
    } else if (roleTests.profiles.found) {
      finalRole = roleTests.profiles.role!
      roleSource = 'profiles'
    } else if (roleTests.app_users.found) {
      finalRole = roleTests.app_users.role!
      roleSource = 'app_users'
    } else {
      finalRole = 'admin' // Default for testing
      roleSource = 'default (admin)'
    }

    console.log('=== TEST ROLE SYSTEM COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      role: {
        value: finalRole,
        source: roleSource,
        timestamp: new Date().toISOString()
      },
      tests: roleTests,
      summary: {
        finalRole: finalRole,
        roleSource: roleSource,
        testsPassed: Object.values(roleTests).filter((test: any) => test.found).length,
        testsFailed: Object.values(roleTests).filter((test: any) => !test.found).length,
        message: `Role system test complete. Final role: ${finalRole} (from ${roleSource})`
      }
    })

  } catch (error) {
    console.error('=== TEST ROLE SYSTEM ERROR ===')
    console.error('Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Test role system failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 