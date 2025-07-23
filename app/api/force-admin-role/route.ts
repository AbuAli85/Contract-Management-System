import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== FORCE ADMIN ROLE START ===')
    
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

    let finalRole = 'admin'
    let roleSource = 'forced'

    // Force set admin role in all tables
    const results: any = {
      users: { success: false, role: null, error: null },
      profiles: { success: false, role: null, error: null },
      app_users: { success: false, role: null, error: null }
    }

    // Force admin role in users table
    try {
      const { data: usersData, error: usersError } = await supabase
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
      
      if (!usersError && usersData) {
        results.users.success = true
        results.users.role = usersData.role
        finalRole = usersData.role || 'admin'
        roleSource = 'users'
        console.log('✅ Admin role forced in users table')
      } else {
        results.users.error = usersError?.message || 'Failed to set admin role'
        console.log('❌ Failed to force admin role in users table:', usersError)
      }
    } catch (error) {
      results.users.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Error forcing admin role in users table:', error)
    }

    // Force admin role in profiles table
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: 'admin',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single()
      
      if (!profilesError && profilesData) {
        results.profiles.success = true
        results.profiles.role = profilesData.role
        if (roleSource === 'forced') {
          finalRole = profilesData.role || 'admin'
          roleSource = 'profiles'
        }
        console.log('✅ Admin role forced in profiles table')
      } else {
        results.profiles.error = profilesError?.message || 'Failed to set admin role'
        console.log('❌ Failed to force admin role in profiles table:', profilesError)
      }
    } catch (error) {
      results.profiles.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Error forcing admin role in profiles table:', error)
    }

    // Force admin role in app_users table
    try {
      const { data: appUsersData, error: appUsersError } = await supabase
        .from('app_users')
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
      
      if (!appUsersError && appUsersData) {
        results.app_users.success = true
        results.app_users.role = appUsersData.role
        if (roleSource === 'forced') {
          finalRole = appUsersData.role || 'admin'
          roleSource = 'app_users'
        }
        console.log('✅ Admin role forced in app_users table')
      } else {
        results.app_users.error = appUsersError?.message || 'Failed to set admin role'
        console.log('❌ Failed to force admin role in app_users table:', appUsersError)
      }
    } catch (error) {
      results.app_users.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Error forcing admin role in app_users table:', error)
    }

    const tablesUpdated = Object.values(results).filter((r: any) => r.success).length
    const tablesFailed = Object.values(results).filter((r: any) => !r.success).length

    console.log('=== FORCE ADMIN ROLE COMPLETE ===')
    
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
      results: results,
      summary: {
        finalRole: finalRole,
        roleSource: roleSource,
        tablesUpdated: tablesUpdated,
        tablesFailed: tablesFailed,
        message: `Admin role forced. Final role: ${finalRole} (from ${roleSource})`
      },
      immediate: {
        role: finalRole,
        source: roleSource,
        instructions: 'Role has been forced in database. Refresh page to see changes.'
      }
    })

  } catch (error) {
    console.error('=== FORCE ADMIN ROLE ERROR ===')
    console.error('Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Force admin role failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 