import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== COMPREHENSIVE ROLE FIX START ===')
    
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
      users: { success: false, role: null as string | null, error: null as string | null, action: '' },
      profiles: { success: false, role: null as string | null, error: null as string | null, action: '' },
      app_users: { success: false, role: null as string | null, error: null as string | null, action: '' },
      policies: { fixed: false, error: null as string | null }
    }

    // Step 1: Try to fix users table policies first
    try {
      console.log('🔄 Step 1: Attempting to fix users table policies...')
      
      // Try to drop problematic policies
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS "Users can view own profile" ON users;
          DROP POLICY IF EXISTS "Users can update own profile" ON users;
          DROP POLICY IF EXISTS "Enable read access for all users" ON users;
          DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
          DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
          DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON users;
        `
      })
      
      if (!dropError) {
        // Create simple policies
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE POLICY "Enable read access for authenticated users" ON users
            FOR SELECT USING (auth.role() = 'authenticated');
            
            CREATE POLICY "Enable insert for authenticated users" ON users
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
            
            CREATE POLICY "Enable update for users based on user_id" ON users
            FOR UPDATE USING (auth.uid() = id);
          `
        })
        
        if (!createError) {
          results.policies.fixed = true
          console.log('✅ Users table policies fixed')
        } else {
          results.policies.error = createError.message
          console.log('❌ Failed to create policies:', createError)
        }
      } else {
        results.policies.error = dropError.message
        console.log('❌ Failed to drop policies:', dropError)
      }
    } catch (error) {
      results.policies.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Error fixing policies:', error)
    }

    // Step 2: Try to create/update user record in users table
    try {
      console.log('🔄 Step 2: Creating/updating user record in users table...')
      
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
        results.users.action = 'created/updated'
        console.log('✅ User record created/updated in users table:', usersData.role)
      } else {
        results.users.error = usersError?.message || 'Failed to create user record'
        results.users.action = 'failed'
        console.log('❌ Failed to create user record in users table:', usersError)
      }
    } catch (error) {
      results.users.error = error instanceof Error ? error.message : 'Unknown error'
      results.users.action = 'error'
      console.log('❌ Error creating user record in users table:', error)
    }

    // Step 3: Create/update user record in profiles table
    try {
      console.log('🔄 Step 3: Creating/updating user record in profiles table...')
      
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
        results.profiles.action = 'created/updated'
        console.log('✅ User record created/updated in profiles table:', profilesData.role)
      } else {
        results.profiles.error = profilesError?.message || 'Failed to create user record'
        results.profiles.action = 'failed'
        console.log('❌ Failed to create user record in profiles table:', profilesError)
      }
    } catch (error) {
      results.profiles.error = error instanceof Error ? error.message : 'Unknown error'
      results.profiles.action = 'error'
      console.log('❌ Error creating user record in profiles table:', error)
    }

    // Step 4: Create/update user record in app_users table
    try {
      console.log('🔄 Step 4: Creating/updating user record in app_users table...')
      
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
        results.app_users.action = 'created/updated'
        console.log('✅ User record created/updated in app_users table:', appUsersData.role)
      } else {
        results.app_users.error = appUsersError?.message || 'Failed to create user record'
        results.app_users.action = 'failed'
        console.log('❌ Failed to create user record in app_users table:', appUsersError)
      }
    } catch (error) {
      results.app_users.error = error instanceof Error ? error.message : 'Unknown error'
      results.app_users.action = 'error'
      console.log('❌ Error creating user record in app_users table:', error)
    }

    // Step 5: Test role loading from all tables
    let finalRole = 'admin'
    let roleSource = 'default'
    const testResults = {
      users: { accessible: false, role: null as string | null, error: null as string | null },
      profiles: { accessible: false, role: null as string | null, error: null as string | null },
      app_users: { accessible: false, role: null as string | null, error: null as string | null }
    }

    // Test users table
    try {
      const { data: testUsersData, error: testUsersError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!testUsersError && testUsersData?.role) {
        testResults.users.accessible = true
        testResults.users.role = testUsersData.role
        finalRole = testUsersData.role
        roleSource = 'users'
        console.log('✅ Users table test successful:', testUsersData.role)
      } else {
        testResults.users.error = testUsersError?.message || 'No data found'
        console.log('❌ Users table test failed:', testUsersError)
      }
    } catch (error) {
      testResults.users.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Users table test error:', error)
    }

    // Test profiles table if users failed
    if (roleSource === 'default') {
      try {
        const { data: testProfilesData, error: testProfilesError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (!testProfilesError && testProfilesData?.role) {
          testResults.profiles.accessible = true
          testResults.profiles.role = testProfilesData.role
          finalRole = testProfilesData.role
          roleSource = 'profiles'
          console.log('✅ Profiles table test successful:', testProfilesData.role)
        } else {
          testResults.profiles.error = testProfilesError?.message || 'No data found'
          console.log('❌ Profiles table test failed:', testProfilesError)
        }
      } catch (error) {
        testResults.profiles.error = error instanceof Error ? error.message : 'Unknown error'
        console.log('❌ Profiles table test error:', error)
      }
    }

    // Test app_users table if still no role
    if (roleSource === 'default') {
      try {
        const { data: testAppUsersData, error: testAppUsersError } = await supabase
          .from('app_users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (!testAppUsersError && testAppUsersData?.role) {
          testResults.app_users.accessible = true
          testResults.app_users.role = testAppUsersData.role
          finalRole = testAppUsersData.role
          roleSource = 'app_users'
          console.log('✅ App_users table test successful:', testAppUsersData.role)
        } else {
          testResults.app_users.error = testAppUsersError?.message || 'No data found'
          console.log('❌ App_users table test failed:', testAppUsersError)
        }
      } catch (error) {
        testResults.app_users.error = error instanceof Error ? error.message : 'Unknown error'
        console.log('❌ App_users table test error:', error)
      }
    }

    const tablesUpdated = Object.values(results).filter((r: any) => r.success).length
    const tablesFailed = Object.values(results).filter((r: any) => !r.success && r.error).length
    const tablesAccessible = Object.values(testResults).filter((r: any) => r.accessible).length

    console.log('=== COMPREHENSIVE ROLE FIX COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      results: results,
      test: testResults,
      role: {
        value: finalRole,
        source: roleSource,
        timestamp: new Date().toISOString()
      },
      summary: {
        finalRole: finalRole,
        roleSource: roleSource,
        tablesUpdated: tablesUpdated,
        tablesFailed: tablesFailed,
        tablesAccessible: tablesAccessible,
        policiesFixed: results.policies.fixed,
        message: `Comprehensive role fix completed. Final role: ${finalRole} (from ${roleSource}). Tables updated: ${tablesUpdated}, accessible: ${tablesAccessible}`
      }
    })

  } catch (error) {
    console.error('=== COMPREHENSIVE ROLE FIX ERROR ===')
    console.error('Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Comprehensive role fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 