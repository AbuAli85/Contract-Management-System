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

    const results: any = {
      userId: user.id,
      userEmail: user.email,
      operations: {
        users: null,
        profiles: null,
        app_users: null
      },
      success: false,
      errors: []
    }

    // Force admin role in users table
    try {
      console.log('🔄 Setting admin role in users table...')
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
      
      if (usersError) {
        results.errors.push(`Users table error: ${usersError.message}`)
        console.log('❌ Users table error:', usersError)
      } else {
        results.operations.users = { success: true, data: usersData }
        console.log('✅ Users table updated:', usersData)
      }
    } catch (error) {
      results.errors.push(`Users table exception: ${error}`)
      console.log('❌ Users table exception:', error)
    }

    // Force admin role in profiles table
    try {
      console.log('🔄 Setting admin role in profiles table...')
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
      
      if (profilesError) {
        results.errors.push(`Profiles table error: ${profilesError.message}`)
        console.log('❌ Profiles table error:', profilesError)
      } else {
        results.operations.profiles = { success: true, data: profilesData }
        console.log('✅ Profiles table updated:', profilesData)
      }
    } catch (error) {
      results.errors.push(`Profiles table exception: ${error}`)
      console.log('❌ Profiles table exception:', error)
    }

    // Force admin role in app_users table
    try {
      console.log('🔄 Setting admin role in app_users table...')
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
      
      if (appUsersError) {
        results.errors.push(`App_users table error: ${appUsersError.message}`)
        console.log('❌ App_users table error:', appUsersError)
      } else {
        results.operations.app_users = { success: true, data: appUsersData }
        console.log('✅ App_users table updated:', appUsersData)
      }
    } catch (error) {
      results.errors.push(`App_users table exception: ${error}`)
      console.log('❌ App_users table exception:', error)
    }

    // Determine if any operation succeeded
    const successfulOperations = Object.values(results.operations).filter((op: any) => op?.success)
    results.success = successfulOperations.length > 0

    console.log('=== FORCE ADMIN ROLE COMPLETE ===')
    
    return NextResponse.json({
      success: results.success,
      results,
      summary: {
        successfulOperations: successfulOperations.length,
        totalErrors: results.errors.length,
        message: results.success 
          ? 'Admin role set successfully in at least one table' 
          : 'Failed to set admin role in any table'
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