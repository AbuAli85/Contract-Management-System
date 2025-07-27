import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Test cookie setting API called')
    
    const supabase = await createClient()
    
    // Try to set a test cookie
    const response = NextResponse.json({ success: true, message: 'Test cookie setting' })
    
    // Test setting a cookie manually
    response.cookies.set({
      name: 'test-cookie',
      value: 'test-value',
      path: '/',
      httpOnly: false
    })
    
    // Check what cookies are in the response
    const responseCookies = response.cookies.getAll()
    console.log('🔧 Response cookies after manual set:', responseCookies.map(c => c.name))
    
    return response
    
  } catch (error) {
    console.error('❌ Test cookie setting API error:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
} 