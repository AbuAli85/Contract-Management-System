import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== ROLE DIAGNOSTIC START ===')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        diagnostic: {
          authStatus: 'FAILED',
          reason: 'No authenticated user found',
          userId: null,
          userEmail: null
        }
      }, { status: 401 })
    }

    console.log('✅ User authenticated:', { id: user.id, email: user.email })

    const diagnostic: any = {
      authStatus: 'SUCCESS',
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      databaseChecks: {
        users: { exists: false, hasRole: false, role: null, error: null },
        profiles: { exists: false, hasRole: false, role: null, error: null },
        app_users: { exists: false, hasRole: false, role: null, error: null }
      },
      localStorage: {
        available: false,
        cachedRole: null,
        error: null
      },
      recommendations: [] as string[]
    }

    // Check users table
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (!usersError && usersData) {
        diagnostic.databaseChecks.users.exists = true
        diagnostic.databaseChecks.users.hasRole = !!usersData.role
        diagnostic.databaseChecks.users.role = usersData.role
        console.log('✅ Users table check:', usersData)
      } else {
        diagnostic.databaseChecks.users.error = usersError?.message || 'No data found'
        console.log('❌ Users table check failed:', usersError)
      }
    } catch (error) {
      diagnostic.databaseChecks.users.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Users table check error:', error)
    }

    // Check profiles table
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (!profilesError && profilesData) {
        diagnostic.databaseChecks.profiles.exists = true
        diagnostic.databaseChecks.profiles.hasRole = !!profilesData.role
        diagnostic.databaseChecks.profiles.role = profilesData.role
        console.log('✅ Profiles table check:', profilesData)
      } else {
        diagnostic.databaseChecks.profiles.error = profilesError?.message || 'No data found'
        console.log('❌ Profiles table check failed:', profilesError)
      }
    } catch (error) {
      diagnostic.databaseChecks.profiles.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Profiles table check error:', error)
    }

    // Check app_users table
    try {
      const { data: appUsersData, error: appUsersError } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (!appUsersError && appUsersData) {
        diagnostic.databaseChecks.app_users.exists = true
        diagnostic.databaseChecks.app_users.hasRole = !!appUsersData.role
        diagnostic.databaseChecks.app_users.role = appUsersData.role
        console.log('✅ App_users table check:', appUsersData)
      } else {
        diagnostic.databaseChecks.app_users.error = appUsersError?.message || 'No data found'
        console.log('❌ App_users table check failed:', appUsersError)
      }
    } catch (error) {
      diagnostic.databaseChecks.app_users.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ App_users table check error:', error)
    }

    // Check localStorage (this will be done on client side)
    diagnostic.localStorage.available = typeof window !== 'undefined'
    diagnostic.localStorage.cachedRole = null // Will be set by client

    // Generate recommendations
    const hasAnyRole = Object.values(diagnostic.databaseChecks).some((check: any) => check.hasRole)
    const hasAdminRole = Object.values(diagnostic.databaseChecks).some((check: any) => check.role === 'admin')
    
    if (!hasAnyRole) {
      diagnostic.recommendations.push('No role found in any table. Use "ENSURE PERMANENT ADMIN ROLE" to set admin role.')
    } else if (!hasAdminRole) {
      diagnostic.recommendations.push('Role found but not admin. Use "ENSURE PERMANENT ADMIN ROLE" to set admin role.')
    } else {
      diagnostic.recommendations.push('Admin role found in database. Issue might be with client-side loading.')
    }

    if (!diagnostic.databaseChecks.users.exists) {
      diagnostic.recommendations.push('User not found in users table. This might be the primary issue.')
    }

    if (!diagnostic.databaseChecks.profiles.exists) {
      diagnostic.recommendations.push('User not found in profiles table. Consider creating profile record.')
    }

    console.log('=== ROLE DIAGNOSTIC COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      diagnostic: diagnostic,
      summary: {
        hasRole: hasAnyRole,
        hasAdminRole: hasAdminRole,
        userExists: diagnostic.databaseChecks.users.exists || diagnostic.databaseChecks.profiles.exists || diagnostic.databaseChecks.app_users.exists,
        recommendations: diagnostic.recommendations
      }
    })

  } catch (error) {
    console.error('=== ROLE DIAGNOSTIC ERROR ===')
    console.error('Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Role diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 