import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== CHECK USER ROLE START ===')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', { id: user.id, email: user.email })

    const roleInfo: any = {
      userId: user.id,
      userEmail: user.email,
      sources: {
        users: null,
        profiles: null,
        app_users: null,
        auth: null
      },
      finalRole: null,
      errors: []
    }

    // Check users table
    try {
      console.log('🔄 Checking users table...')
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .eq('id', user.id)
        .single()
      
      if (usersError) {
        roleInfo.errors.push(`Users table error: ${usersError.message}`)
        console.log('❌ Users table error:', usersError)
      } else {
        roleInfo.sources.users = usersData
        console.log('✅ Users table data:', usersData)
      }
    } catch (error) {
      roleInfo.errors.push(`Users table exception: ${error}`)
      console.log('❌ Users table exception:', error)
    }

    // Check profiles table
    try {
      console.log('🔄 Checking profiles table...')
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role, created_at')
        .eq('id', user.id)
        .single()
      
      if (profilesError) {
        roleInfo.errors.push(`Profiles table error: ${profilesError.message}`)
        console.log('❌ Profiles table error:', profilesError)
      } else {
        roleInfo.sources.profiles = profilesData
        console.log('✅ Profiles table data:', profilesData)
      }
    } catch (error) {
      roleInfo.errors.push(`Profiles table exception: ${error}`)
      console.log('❌ Profiles table exception:', error)
    }

    // Check app_users table
    try {
      console.log('🔄 Checking app_users table...')
      const { data: appUsersData, error: appUsersError } = await supabase
        .from('app_users')
        .select('id, email, role, created_at')
        .eq('id', user.id)
        .single()
      
      if (appUsersError) {
        roleInfo.errors.push(`App_users table error: ${appUsersError.message}`)
        console.log('❌ App_users table error:', appUsersError)
      } else {
        roleInfo.sources.app_users = appUsersData
        console.log('✅ App_users table data:', appUsersData)
      }
    } catch (error) {
      roleInfo.errors.push(`App_users table exception: ${error}`)
      console.log('❌ App_users table exception:', error)
    }

    // Determine final role (priority: users > profiles > app_users > default)
    if (roleInfo.sources.users?.role) {
      roleInfo.finalRole = roleInfo.sources.users.role
      console.log('✅ Final role from users table:', roleInfo.finalRole)
    } else if (roleInfo.sources.profiles?.role) {
      roleInfo.finalRole = roleInfo.sources.profiles.role
      console.log('✅ Final role from profiles table:', roleInfo.finalRole)
    } else if (roleInfo.sources.app_users?.role) {
      roleInfo.finalRole = roleInfo.sources.app_users.role
      console.log('✅ Final role from app_users table:', roleInfo.finalRole)
    } else {
      roleInfo.finalRole = 'user' // Default fallback
      console.log('⚠️ No role found, using default: user')
    }

    console.log('=== CHECK USER ROLE COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      roleInfo,
      summary: {
        hasRoleInUsers: !!roleInfo.sources.users?.role,
        hasRoleInProfiles: !!roleInfo.sources.profiles?.role,
        hasRoleInAppUsers: !!roleInfo.sources.app_users?.role,
        finalRole: roleInfo.finalRole,
        totalErrors: roleInfo.errors.length
      }
    })

  } catch (error) {
    console.error('=== CHECK USER ROLE ERROR ===')
    console.error('Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Role check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 