import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== FORCE ROLE REFRESH START ===')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    console.log('✅ User authenticated:', { id: user.id, email: user.email })

    // Get the latest role from all possible sources with detailed logging
    let currentRole = 'user'
    let roleSource = 'default'
    let roleDetails: any = {
      users: null,
      profiles: null,
      app_users: null,
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
        roleDetails.errors.push(`Users table error: ${usersError.message}`)
        console.log('❌ Users table error:', usersError)
      } else {
        roleDetails.users = usersData
        if (usersData?.role) {
          currentRole = usersData.role
          roleSource = 'users'
          console.log('✅ Role from users table:', currentRole)
        } else {
          console.log('⚠️ Users table has no role field')
        }
      }
    } catch (error) {
      roleDetails.errors.push(`Users table exception: ${error}`)
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
        roleDetails.errors.push(`Profiles table error: ${profilesError.message}`)
        console.log('❌ Profiles table error:', profilesError)
      } else {
        roleDetails.profiles = profilesData
        if (profilesData?.role && roleSource === 'default') {
          currentRole = profilesData.role
          roleSource = 'profiles'
          console.log('✅ Role from profiles table:', currentRole)
        } else if (profilesData?.role) {
          console.log('ℹ️ Profiles table has role but users table took priority')
        } else {
          console.log('⚠️ Profiles table has no role field')
        }
      }
    } catch (error) {
      roleDetails.errors.push(`Profiles table exception: ${error}`)
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
        roleDetails.errors.push(`App_users table error: ${appUsersError.message}`)
        console.log('❌ App_users table error:', appUsersError)
      } else {
        roleDetails.app_users = appUsersData
        if (appUsersData?.role && roleSource === 'default') {
          currentRole = appUsersData.role
          roleSource = 'app_users'
          console.log('✅ Role from app_users table:', currentRole)
        } else if (appUsersData?.role) {
          console.log('ℹ️ App_users table has role but other tables took priority')
        } else {
          console.log('⚠️ App_users table has no role field')
        }
      }
    } catch (error) {
      roleDetails.errors.push(`App_users table exception: ${error}`)
      console.log('❌ App_users table exception:', error)
    }

    // If no role found, try to set admin role
    if (roleSource === 'default') {
      console.log('⚠️ No role found in any table, attempting to set admin role...')
      
      // Try to insert admin role in users table
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            role: 'admin',
            created_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .select()
          .single()
        
        if (!insertError && insertData) {
          currentRole = 'admin'
          roleSource = 'users (inserted)'
          console.log('✅ Admin role inserted into users table')
        } else {
          console.log('❌ Failed to insert admin role:', insertError)
        }
      } catch (error) {
        console.log('❌ Exception inserting admin role:', error)
      }
    }

    console.log('=== FORCE ROLE REFRESH COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      role: {
        value: currentRole,
        source: roleSource,
        timestamp: new Date().toISOString()
      },
      details: roleDetails,
      summary: {
        finalRole: currentRole,
        roleSource: roleSource,
        hasRoleInUsers: !!roleDetails.users?.role,
        hasRoleInProfiles: !!roleDetails.profiles?.role,
        hasRoleInAppUsers: !!roleDetails.app_users?.role,
        totalErrors: roleDetails.errors.length,
        message: `Role refreshed: ${currentRole} (from ${roleSource})`
      }
    })

  } catch (error) {
    console.error('=== FORCE ROLE REFRESH ERROR ===')
    console.error('Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Force role refresh failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 