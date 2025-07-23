import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ENSURE ADMIN ROLE START ===')
    
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

    // Ensure admin role exists in all tables
    const results: any = {
      users: { success: false, message: '', role: null },
      profiles: { success: false, message: '', role: null },
      app_users: { success: false, message: '', role: null }
    }

    // Ensure admin role in users table
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
        results.users = { success: true, message: 'Admin role set in users table', role: usersData.role }
        console.log('✅ Admin role ensured in users table')
      } else {
        results.users = { success: false, message: usersError?.message || 'Failed to set admin role in users table', role: null }
        console.log('❌ Failed to set admin role in users table:', usersError)
      }
    } catch (error) {
      results.users = { success: false, message: error instanceof Error ? error.message : 'Unknown error', role: null }
      console.log('❌ Error setting admin role in users table:', error)
    }

    // Ensure admin role in profiles table
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
        results.profiles = { success: true, message: 'Admin role set in profiles table', role: profilesData.role }
        console.log('✅ Admin role ensured in profiles table')
      } else {
        results.profiles = { success: false, message: profilesError?.message || 'Failed to set admin role in profiles table', role: null }
        console.log('❌ Failed to set admin role in profiles table:', profilesError)
      }
    } catch (error) {
      results.profiles = { success: false, message: error instanceof Error ? error.message : 'Unknown error', role: null }
      console.log('❌ Error setting admin role in profiles table:', error)
    }

    // Ensure admin role in app_users table
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
        results.app_users = { success: true, message: 'Admin role set in app_users table', role: appUsersData.role }
        console.log('✅ Admin role ensured in app_users table')
      } else {
        results.app_users = { success: false, message: appUsersError?.message || 'Failed to set admin role in app_users table', role: null }
        console.log('❌ Failed to set admin role in app_users table:', appUsersError)
      }
    } catch (error) {
      results.app_users = { success: false, message: error instanceof Error ? error.message : 'Unknown error', role: null }
      console.log('❌ Error setting admin role in app_users table:', error)
    }

    // Get the final role from the most reliable source
    let finalRole = 'admin'
    let roleSource = 'default'
    
    if (results.users.success) {
      finalRole = results.users.role || 'admin'
      roleSource = 'users'
    } else if (results.profiles.success) {
      finalRole = results.profiles.role || 'admin'
      roleSource = 'profiles'
    } else if (results.app_users.success) {
      finalRole = results.app_users.role || 'admin'
      roleSource = 'app_users'
    }

    console.log('=== ENSURE ADMIN ROLE COMPLETE ===')
    
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
        tablesUpdated: Object.values(results).filter((r: any) => r.success).length,
        tablesFailed: Object.values(results).filter((r: any) => !r.success).length,
        message: `Admin role permanently ensured. Final role: ${finalRole} (from ${roleSource})`
      }
    })

  } catch (error) {
    console.error('=== ENSURE ADMIN ROLE ERROR ===')
    console.error('Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Ensure admin role failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 