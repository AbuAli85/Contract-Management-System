// Comprehensive authentication fix
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    console.log('🔍 Auth Debug: Testing authentication endpoints...')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('📋 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!serviceRoleKey,
      url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing'
    })

    return NextResponse.json({ 
      status: 'debug endpoint working',
      env: {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!serviceRoleKey
      }
    })
  } catch (error) {
    console.error('❌ Auth Debug Error:', error)
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
}
