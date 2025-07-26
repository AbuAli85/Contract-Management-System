import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can run this test' }, { status: 403 })
    }

    const body = await request.json()
    const { email, fullName } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create a test user in auth.users (this should trigger the handle_new_user function)
    const testUserId = crypto.randomUUID()
    
    // Insert directly into auth.users to simulate signup
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO auth.users (
          id, 
          email, 
          encrypted_password, 
          email_confirmed_at, 
          raw_user_meta_data,
          created_at,
          updated_at
        ) VALUES (
          '${testUserId}',
          '${email}',
          'dummy_password_hash',
          NOW(),
          '{"full_name": "${fullName || 'Test User'}"}',
          NOW(),
          NOW()
        );
      `
    })

    if (insertError) {
      console.error('Error creating test user:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create test user',
        details: insertError.message 
      }, { status: 500 })
    }

    // Check if records were created in both tables
    const { data: profileRecord } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single()

    const { data: userRecord } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single()

    // Clean up the test user
    await supabase.rpc('exec_sql', {
      sql: `
        DELETE FROM auth.users WHERE id = '${testUserId}';
        DELETE FROM public.profiles WHERE id = '${testUserId}';
        DELETE FROM public.users WHERE id = '${testUserId}';
      `
    })

    return NextResponse.json({
      success: true,
      message: 'User signup trigger test completed',
      results: {
        profileRecordCreated: !!profileRecord,
        userRecordCreated: !!userRecord,
        userStatus: userRecord?.status,
        profileRecord,
        userRecord
      }
    })

  } catch (error) {
    console.error('Error in test-user-signup:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 