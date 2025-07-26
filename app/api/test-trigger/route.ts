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
      return NextResponse.json({ error: 'Only admins can test triggers' }, { status: 403 })
    }

    const body = await request.json()
    const { email, fullName } = body

    if (!email || !fullName) {
      return NextResponse.json({ error: 'Email and fullName are required' }, { status: 400 })
    }

    console.log('🧪 Testing trigger with:', { email, fullName })

    // First, check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, status')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User already exists',
        existingUser 
      }, { status: 400 })
    }

    // Create a test user in auth.users (this should trigger the handle_new_user function)
    const testUserId = crypto.randomUUID()
    const testUser = {
      id: testUserId,
      email: email,
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      raw_user_meta_data: {
        full_name: fullName
      }
    }

    console.log('📝 Inserting test user into auth.users:', testUser)

    // Note: This is a test - in production, we'd use supabase.auth.admin.createUser
    // But for testing the trigger, we'll simulate the insertion
    const { data: insertedAuthUser, error: authInsertError } = await supabase
      .from('auth.users')
      .insert([testUser])
      .select()
      .single()

    if (authInsertError) {
      console.error('❌ Error inserting into auth.users:', authInsertError)
      return NextResponse.json({ 
        error: 'Failed to insert test user',
        details: authInsertError 
      }, { status: 500 })
    }

    console.log('✅ Test user inserted into auth.users:', insertedAuthUser)

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if records were created in profiles and users tables
    const { data: profileRecord, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single()

    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single()

    console.log('📊 Profile record:', profileRecord, profileError)
    console.log('📊 User record:', userRecord, userError)

    // Clean up - delete the test user
    await supabase.from('auth.users').delete().eq('id', testUserId)
    if (profileRecord) {
      await supabase.from('profiles').delete().eq('id', testUserId)
    }
    if (userRecord) {
      await supabase.from('users').delete().eq('id', testUserId)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Trigger test completed',
      results: {
        authUserInserted: !!insertedAuthUser,
        profileCreated: !!profileRecord,
        userCreated: !!userRecord,
        profileError: profileError?.message,
        userError: userError?.message,
        profileRecord,
        userRecord
      }
    })

  } catch (error) {
    console.error('Error in POST /api/test-trigger:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 