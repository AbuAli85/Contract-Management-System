import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== FIX USERS TABLE POLICY START ===')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', { id: user.id, email: user.email })

    const results = {
      policiesDropped: 0,
      policiesCreated: 0,
      errors: [] as string[]
    }

    // Drop existing problematic policies
    try {
      console.log('🔄 Dropping existing policies...')
      
      // Try direct SQL approach
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS "Users can view own profile" ON users;
          DROP POLICY IF EXISTS "Users can update own profile" ON users;
          DROP POLICY IF EXISTS "Enable read access for all users" ON users;
          DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
          DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
          DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON users;
        `
      })
      
      if (sqlError) {
        results.errors.push(`Failed to drop policies: ${sqlError.message}`)
        console.log('❌ Failed to drop policies:', sqlError)
      } else {
        results.policiesDropped = 5 // Approximate count
        console.log('✅ Policies dropped successfully')
      }
    } catch (error) {
      results.errors.push(`Error dropping policies: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.log('❌ Error dropping policies:', error)
    }

    // Create new simple policies
    try {
      console.log('🔄 Creating new simple policies...')
      
      // Enable read access for authenticated users
      const { error: readError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE POLICY "Enable read access for authenticated users" ON users
          FOR SELECT USING (auth.role() = 'authenticated');
        `
      })
      
      if (readError) {
        results.errors.push(`Failed to create read policy: ${readError.message}`)
        console.log('❌ Failed to create read policy:', readError)
      } else {
        results.policiesCreated++
        console.log('✅ Read policy created')
      }

      // Enable insert for authenticated users
      const { error: insertError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE POLICY "Enable insert for authenticated users" ON users
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        `
      })
      
      if (insertError) {
        results.errors.push(`Failed to create insert policy: ${insertError.message}`)
        console.log('❌ Failed to create insert policy:', insertError)
      } else {
        results.policiesCreated++
        console.log('✅ Insert policy created')
      }

      // Enable update for users based on user_id
      const { error: updateError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE POLICY "Enable update for users based on user_id" ON users
          FOR UPDATE USING (auth.uid() = id);
        `
      })
      
      if (updateError) {
        results.errors.push(`Failed to create update policy: ${updateError.message}`)
        console.log('❌ Failed to create update policy:', updateError)
      } else {
        results.policiesCreated++
        console.log('✅ Update policy created')
      }

    } catch (error) {
      results.errors.push(`Error creating policies: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.log('❌ Error creating policies:', error)
    }

    // Test the fix by trying to access the users table
    let testResult = { success: false, error: null as string | null }
    try {
      console.log('🔄 Testing users table access...')
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .single()
      
      if (!testError && testData) {
        testResult.success = true
        console.log('✅ Users table access test successful:', testData)
      } else {
        testResult.error = testError?.message || 'Unknown error'
        console.log('❌ Users table access test failed:', testError)
      }
    } catch (error) {
      testResult.error = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Users table access test error:', error)
    }

    console.log('=== FIX USERS TABLE POLICY COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      results: results,
      test: testResult,
      summary: {
        policiesDropped: results.policiesDropped,
        policiesCreated: results.policiesCreated,
        errors: results.errors.length,
        testSuccess: testResult.success,
        message: `Users table policy fix completed. Policies dropped: ${results.policiesDropped}, created: ${results.policiesCreated}, test success: ${testResult.success}`
      }
    })

  } catch (error) {
    console.error('=== FIX USERS TABLE POLICY ERROR ===')
    console.error('Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Fix users table policy failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 