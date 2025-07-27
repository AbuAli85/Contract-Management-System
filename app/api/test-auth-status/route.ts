import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Test auth status API called')
    const supabase = await createClient()
    
    // Get current user to check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 Auth status result:', { hasUser: !!user, authError: authError?.message })
    
    if (authError || !user) {
      console.log('❌ No authenticated user found')
      return NextResponse.json({ 
        authenticated: false, 
        error: authError?.message || 'No user found',
        message: 'Please log in to access this resource'
      })
    }

    console.log('✅ User authenticated:', user.id)
    
    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, status, full_name')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
      return NextResponse.json({ 
        authenticated: true,
        user: {
          id: user.id,
          email: user.email
        },
        profileError: profileError.message,
        message: 'User authenticated but profile not found'
      })
    }

    console.log('✅ User profile found:', userProfile)
    
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile: userProfile,
      isAdmin: userProfile.role === 'admin',
      canAccessUserApprovals: userProfile.role === 'admin',
      message: userProfile.role === 'admin' 
        ? 'User is admin and can access user approvals' 
        : 'User is not admin and cannot access user approvals'
    })
  } catch (error) {
    console.error('❌ Test auth status API error:', error)
    return NextResponse.json({ 
      authenticated: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Error checking authentication status'
    })
  }
} 