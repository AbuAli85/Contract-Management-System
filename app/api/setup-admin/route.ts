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

    // Check if user exists in users table
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', email)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json({ error: 'Failed to check user' }, { status: 500 })
    }

    if (existingUser) {
      // Update existing user to admin role
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('Error updating user role:', updateError)
        return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'User role updated to admin',
        user: { id: existingUser.id, email, role: 'admin' }
      })
    } else {
      // Create new admin user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating admin user:', createError)
        return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Admin user created successfully',
        user: newUser
      })
    }

  } catch (error) {
    console.error('Error in setup-admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 