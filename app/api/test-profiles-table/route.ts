import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test if profiles table exists
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.log('Profiles table test error:', testError)
      
      // For now, just return error info since we can't create tables via client
      return NextResponse.json({
        success: false,
        error: 'Profiles table does not exist',
        details: testError,
        suggestion: 'Please create the profiles table in your database'
      })
    }
    
    // Get current user session
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError || !profile) {
        // Create profile for user
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            role: 'admin', // Default to admin for testing
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (insertError) {
          console.log('Insert profile error:', insertError)
        } else {
          console.log('Profile created for user:', user.id)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profiles table is ready',
      user: user?.id || null
    })
    
  } catch (error) {
    console.error('Test profiles table error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    })
  }
} 