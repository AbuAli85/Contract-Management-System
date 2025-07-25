import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Create a test user
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123'
    
    // First, try to sign up the user
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`
      }
    })

    if (signupError) {
      console.error('Signup error:', signupError)
      return NextResponse.json({
        success: false,
        error: signupError.message,
        type: 'signup'
      }, { status: 400 })
    }

    // Try to create user profile in database
    let profileError = null
    try {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: signupData.user?.id,
          email: testEmail,
          full_name: 'Test User',
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString()
        })
      
      profileError = insertError
    } catch (tableError) {
      console.log('Users table not found, skipping profile creation')
      profileError = null // Ignore profile creation error for now
    }

    return NextResponse.json({
      success: true,
      user: {
        id: signupData.user?.id,
        email: testEmail,
        confirmed: !!signupData.user?.email_confirmed_at
      },
      profileError: profileError?.message,
      credentials: {
        email: testEmail,
        password: testPassword
      }
    })
  } catch (error) {
    console.error('Create test user error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 