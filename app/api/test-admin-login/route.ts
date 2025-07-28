import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Test admin login API called')
    const supabase = await createClient()
    
    const body = await request.json()
    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      })
    }
    
    console.log('🔐 Attempting login with:', email)
    
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ Login error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      })
    }
    
    if (!data.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No user returned from login' 
      })
    }
    
    console.log('✅ Login successful for user:', data.user.id)
    
    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, status, full_name')
      .eq('id', data.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
      return NextResponse.json({ 
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email
        },
        profileError: profileError.message,
        message: 'Login successful but profile not found'
      })
    }
    
    console.log('✅ User profile found:', userProfile)
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email
      },
      profile: userProfile,
      isAdmin: userProfile.role === 'admin',
      message: userProfile.role === 'admin' 
        ? 'Login successful! You are an admin and can access user approvals.' 
        : 'Login successful! You are not an admin and cannot access user approvals.'
    })
    
  } catch (error) {
    console.error('❌ Test admin login API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// GET - Provide available admin credentials
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Test admin login info API called')
    
    // List available admin users from the database
    const supabase = await createClient()
    
    const { data: adminUsers, error } = await supabase
      .from('users')
      .select('email, role, status, full_name')
      .eq('role', 'admin')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching admin users:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch admin users' 
      })
    }
    
    console.log('✅ Found admin users:', adminUsers?.length || 0)
    
    return NextResponse.json({ 
      success: true,
      adminUsers: adminUsers || [],
      message: 'Available admin users for testing',
      note: 'Use POST with email and password to test login'
    })
    
  } catch (error) {
    console.error('❌ Test admin login info API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 