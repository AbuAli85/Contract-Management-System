import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Debug cookies-server API called')
    
    // Get all cookies from the request
    const allCookies = request.cookies.getAll()
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('sb-')
    )
    
    // Create the server-side Supabase client
    const supabase = await createClient()
    
    // Try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    const debugInfo = {
      totalCookies: allCookies.length,
      allCookies: allCookies.map(c => ({ name: c.name, length: c.value.length })),
      authCookies: authCookies.map(c => ({ name: c.name, length: c.value.length })),
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      sessionError: sessionError?.message || null,
      userError: userError?.message || null,
      url: request.url,
      timestamp: new Date().toISOString()
    }
    
    console.log('🔧 Debug cookies-server result:', debugInfo)
    return NextResponse.json({ success: true, debug: debugInfo })
  } catch (error) {
    console.error('❌ Debug cookies-server API error:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
} 