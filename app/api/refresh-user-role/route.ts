import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== REFRESH USER ROLE START ===')
    
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

    // Check users table
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!usersError && usersData?.role) {
        currentRole = usersData.role
        roleSource = 'users'
        console.log('✅ Role from users table:', currentRole)
      }
    } catch (error) {
      console.log('❌ Users table check failed:', error)
    }

    // Check profiles table if users didn't have role
    if (roleSource === 'default') {
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (!profilesError && profilesData?.role) {
          currentRole = profilesData.role
          roleSource = 'profiles'
          console.log('✅ Role from profiles table:', currentRole)
        }
      } catch (error) {
        console.log('❌ Profiles table check failed:', error)
      }
    }

    // Check app_users table if still no role
    if (roleSource === 'default') {
      try {
        const { data: appUsersData, error: appUsersError } = await supabase
          .from('app_users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (!appUsersError && appUsersData?.role) {
          currentRole = appUsersData.role
          roleSource = 'app_users'
          console.log('✅ Role from app_users table:', currentRole)
        }
      } catch (error) {
        console.log('❌ App_users table check failed:', error)
      }
    }

    console.log('=== REFRESH USER ROLE COMPLETE ===')
    
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
      message: `Role refreshed: ${currentRole} (from ${roleSource})`
    })

  } catch (error) {
    console.error('=== REFRESH USER ROLE ERROR ===')
    console.error('Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Role refresh failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 