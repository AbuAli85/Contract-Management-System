import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Testing login process...')
    
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase client not available'
      }, { status: 500 })
    }

    console.log('🔧 Attempting sign in with:', email)
    
    // Test the sign in process
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    
    if (error) {
      console.error('❌ Login test failed:', error)
      return NextResponse.json({
        success: false,
        error: 'Login failed',
        details: error.message
      }, { status: 401 })
    }

    console.log('✅ Login test successful:', data.user?.id)
    
    // Test profile loading
    if (data.user) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, role, status')
          .eq('id', data.user.id)
          .single()
        
        if (userError) {
          console.warn('⚠️ Profile loading failed:', userError.message)
        } else {
          console.log('✅ Profile loaded:', userData)
        }
      } catch (profileError) {
        console.warn('⚠️ Profile loading error:', profileError)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Login test successful',
      data: {
        userId: data.user?.id,
        email: data.user?.email,
        session: !!data.session
      }
    })

  } catch (error) {
    console.error('❌ Login test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Login test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 