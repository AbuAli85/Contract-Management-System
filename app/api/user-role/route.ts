import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /user-role: Starting request')
    
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('❌ API /user-role: User auth error:', userError.message)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!user) {
      console.log('❌ API /user-role: No authenticated user')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    console.log('✅ API /user-role: User authenticated:', user.email)
    
    // Try to get role using RPC function
    try {
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { uid: user.id })
      
      if (roleError) {
        console.log('⚠️ API /user-role: RPC error:', roleError.message)
        
        // Fallback: Check if user is admin by email
        const fallbackRole = user.email === 'luxsess2001@gmail.com' ? 'admin' : 'user'
        console.log('🔄 API /user-role: Using email fallback:', fallbackRole)
        
        return NextResponse.json({ role: fallbackRole })
      }
      
      const role = roleData || 'user'
      console.log('✅ API /user-role: Got role from RPC:', role)
      
      return NextResponse.json({ role })
    } catch (error) {
      console.log('❌ API /user-role: RPC function failed:', error)
      
      // Final fallback
      const fallbackRole = user.email === 'luxsess2001@gmail.com' ? 'admin' : 'user'
      console.log('🔄 API /user-role: Final fallback:', fallbackRole)
      
      return NextResponse.json({ role: fallbackRole })
    }
  } catch (error) {
    console.error('❌ API /user-role: Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
