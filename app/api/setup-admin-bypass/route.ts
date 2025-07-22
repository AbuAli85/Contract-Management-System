import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('BYPASS: Setup admin request for user:', { id: user.id, email: user.email })

    // Always return success - this is a bypass for testing
    return NextResponse.json({ 
      success: true, 
      message: 'Admin setup completed (BYPASS MODE)',
      user: {
        id: user.id,
        email: user.email,
        role: 'admin',
        created_at: new Date().toISOString()
      },
      warning: 'This is a bypass mode for testing. Database operations were skipped.',
      bypass: true
    })

  } catch (error) {
    console.error('Error in setup-admin-bypass:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 