import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret } = body
    
    // Basic security check
    if (secret !== 'fix-admin-role-2025') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
    }
    
    // Create raw supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Missing environment variables'
      }, { status: 500 })
    }

    // Use dynamic import to avoid TypeScript issues
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const targetUserId = '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170'
    const targetEmail = 'luxsess2001@gmail.com'
    
    console.log('Starting admin role fix for:', targetEmail, targetUserId)
    
    // Step 1: Update profiles table
    const profileResult = await supabase
      .from('profiles')
      .upsert({
        id: targetUserId,
        email: targetEmail,
        full_name: 'Fahad alamri',
        role: 'admin',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .select()
    
    // Step 2: Update users table  
    const userResult = await supabase
      .from('users')
      .upsert({
        id: targetUserId,
        email: targetEmail,
        full_name: 'Fahad alamri',
        role: 'admin',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .select()
    
    // Step 3: Update auth metadata
    const authResult = await supabase.auth.admin.updateUserById(
      targetUserId,
      {
        user_metadata: {
          role: 'admin',
          full_name: 'Fahad alamri'
        }
      }
    )
    
    return NextResponse.json({
      success: true,
      message: 'Admin role fix completed',
      results: {
        profile: {
          data: profileResult.data,
          error: profileResult.error?.message
        },
        user: {
          data: userResult.data,
          error: userResult.error?.message
        },
        auth: {
          data: authResult.data,
          error: authResult.error?.message
        }
      }
    })
    
  } catch (error) {
    console.error('Admin role fix error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
