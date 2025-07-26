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

    // Create a test user using Supabase admin API (this should trigger the handle_new_user function)
    const testUserData = {
      email: email,
      password: 'TestPassword123!', // Temporary password for testing
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    }

    console.log('📝 Creating test user via admin API:', testUserData)

    // Use the admin API to create a user (this will trigger the handle_new_user function)
    const { data: createdAuthUser, error: authCreateError } = await supabase.auth.admin.createUser({
      email: testUserData.email,
      password: testUserData.password,
      email_confirm: true,
      user_metadata: testUserData.user_metadata
    })

    if (authCreateError) {
      console.error('❌ Error creating auth user:', authCreateError)
      return NextResponse.json({ 
        error: 'Failed to create test user',
        details: authCreateError 
      }, { status: 500 })
    }

    console.log('✅ Test user created in auth.users:', createdAuthUser)

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if records were created in profiles and users tables
    const { data: profileRecord, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', createdAuthUser.user.id)
      .single()

    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', createdAuthUser.user.id)
      .single()

    console.log('📊 Profile record:', profileRecord, profileError)
    console.log('📊 User record:', userRecord, userError)

    // Clean up - delete the test user
    try {
      await supabase.auth.admin.deleteUser(createdAuthUser.user.id)
      console.log('🧹 Test user deleted from auth.users')
    } catch (deleteError) {
      console.warn('⚠️ Failed to delete test user:', deleteError)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Trigger test completed',
      results: {
        authUserCreated: !!createdAuthUser,
        profileCreated: !!profileRecord,
        userCreated: !!userRecord,
        profileError: profileError?.message,
        userError: userError?.message,
        profileRecord,
        userRecord,
        authUser: {
          id: createdAuthUser.user.id,
          email: createdAuthUser.user.email,
          created_at: createdAuthUser.user.created_at
        }
      }
    })

  } catch (error) {
    console.error('Error in POST /api/test-trigger:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 