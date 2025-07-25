import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== FORCE UI REFRESH START ===')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', { id: user.id, email: user.email })

    // Get the latest role from all possible sources
    let currentRole = 'user'
    let roleSource = 'default'
    let roleDetails = {
      users: null as any,
      profiles: null as any,
      app_users: null as any,
      errors: [] as string[]
    }

    // Check users table
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .eq('id', user.id)
        .single()
      
      if (!usersError && usersData?.role) {
        currentRole = usersData.role
        roleSource = 'users'
        roleDetails.users = usersData
        console.log('✅ Role from users table:', currentRole)
      }
    } catch (error) {
      roleDetails.errors.push(`Users table error: ${error}`)
    }

    // Check profiles table if users didn't have role
    if (roleSource === 'default') {
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, role, created_at')
          .eq('id', user.id)
          .single()
        
        if (!profilesError && profilesData?.role) {
          currentRole = profilesData.role
          roleSource = 'profiles'
          roleDetails.profiles = profilesData
          console.log('✅ Role from profiles table:', currentRole)
        }
      } catch (error) {
        roleDetails.errors.push(`Profiles table error: ${error}`)
      }
    }

    // Check app_users table if still no role
    if (roleSource === 'default') {
      try {
        const { data: appUsersData, error: appUsersError } = await supabase
          .from('app_users')
          .select('id, email, role, created_at')
          .eq('id', user.id)
          .single()
        
        if (!appUsersError && appUsersData?.role) {
          currentRole = appUsersData.role
          roleSource = 'app_users'
          roleDetails.app_users = appUsersData
          console.log('✅ Role from app_users table:', currentRole)
        }
      } catch (error) {
        roleDetails.errors.push(`App_users table error: ${error}`)
      }
    }

    // If no role found, set admin role
    if (roleSource === 'default') {
      console.log('⚠️ No role found, setting admin role...')
      
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email || '',
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
        }
      } catch (error) {
        console.log('❌ Failed to insert admin role:', error)
      }
    }

    console.log('=== FORCE UI REFRESH COMPLETE ===')
    
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
      uiRefresh: {
        required: true,
        reason: 'Role state mismatch detected',
        instructions: 'Please refresh the page to see updated role'
      },
      summary: {
        finalRole: currentRole,
        roleSource: roleSource,
        hasRoleInUsers: !!roleDetails.users?.role,
        hasRoleInProfiles: !!roleDetails.profiles?.role,
        hasRoleInAppUsers: !!roleDetails.app_users?.role,
        totalErrors: roleDetails.errors.length,
        message: `UI refresh required: ${currentRole} (from ${roleSource})`
      }
    })

  } catch (error) {
    console.error('=== FORCE UI REFRESH ERROR ===')
    console.error('Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Force UI refresh failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 