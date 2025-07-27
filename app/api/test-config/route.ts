import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Test config API called')
    
    const config = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV,
      nextPublicUrl: process.env.NEXT_PUBLIC_URL,
      cookies: Object.fromEntries(request.cookies.entries())
    }
    
    console.log('🔧 Config check:', config)
    
    return NextResponse.json({ 
      success: true,
      config
    })
  } catch (error) {
    console.error('❌ Test config API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 