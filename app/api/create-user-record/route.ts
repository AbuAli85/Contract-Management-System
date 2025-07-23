import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE USER RECORD START ===')
    
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

    const results = {
      users: { created: false, exists: false, error: null },
      profiles: { created: false, exists: false, error: null },
      app_users: { created: false, exists: false, error: null }
    }

    // Create user record in users table
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
        results.users.created = true
        results.users.exists = true
        console.log('✅ User record created/updated in users table')
      } else {
        results.users.error = usersError?.message || 'Failed to create user record'
        console.log('❌ Failed to create user record in users table:', usersError)
      }
    } catch (error) {
      results.users.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Error creating user record in users table:', error)
    }

    // Create user record in profiles table
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
        results.profiles.created = true
        results.profiles.exists = true
        console.log('✅ User record created/updated in profiles table')
      } else {
        results.profiles.error = profilesError?.message || 'Failed to create user record'
        console.log('❌ Failed to create user record in profiles table:', profilesError)
      }
    } catch (error) {
      results.profiles.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Error creating user record in profiles table:', error)
    }

    // Create user record in app_users table
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
        results.app_users.created = true
        results.app_users.exists = true
        console.log('✅ User record created/updated in app_users table')
      } else {
        results.app_users.error = appUsersError?.message || 'Failed to create user record'
        console.log('❌ Failed to create user record in app_users table:', appUsersError)
      }
    } catch (error) {
      results.app_users.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Error creating user record in app_users table:', error)
    }

    const tablesCreated = Object.values(results).filter(r => r.created).length
    const tablesFailed = Object.values(results).filter(r => !r.created && r.error).length

    console.log('=== CREATE USER RECORD COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      results: results,
      summary: {
        tablesCreated: tablesCreated,
        tablesFailed: tablesFailed,
        message: `User records created in ${tablesCreated} tables. Failed: ${tablesFailed} tables.`
      }
    })

  } catch (error) {
    console.error('=== CREATE USER RECORD ERROR ===')
    console.error('Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Create user record failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 