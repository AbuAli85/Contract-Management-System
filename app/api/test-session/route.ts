import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Test session API called')
    const supabase = await createClient()
    
    // Get current user to check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 Session test result:', { hasUser: !!user, authError: authError?.message })
    
    if (authError || !user) {
      console.log('❌ No authenticated user found')
      return NextResponse.json({ 
        authenticated: false, 
        error: authError?.message || 'No user found',
        cookieCount: request.cookies.getAll().length
      })
    }

    console.log('✅ User authenticated:', user.id)
    
    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('id', user.id)
      .single()
    
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile: userProfile,
      profileError: profileError?.message,
      cookieCount: request.cookies.getAll().length
    })
  } catch (error) {
    console.error('❌ Test session API error:', error)
    return NextResponse.json({ 
      authenticated: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      cookieCount: request.cookies.getAll().length
    })
  }
} 