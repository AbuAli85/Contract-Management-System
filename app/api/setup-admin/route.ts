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
    let existingUser = null
    let fetchError = null
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', email)
        .single()
      
      existingUser = userData
      fetchError = userError
    } catch (error) {
      console.log('Users table not found, trying profiles table')
      
      // Fallback to profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()
      
      existingUser = profileData
      fetchError = profileError
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json({ error: 'Failed to check user' }, { status: 500 })
    }

    if (existingUser) {
      // Update existing user to admin role
      let updateError = null
      
      try {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ 
            role: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
        
        updateError = userUpdateError
      } catch (error) {
        console.log('Users table update failed, trying profiles table')
        
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin'
          })
          .eq('id', existingUser.id)
        
        updateError = profileUpdateError
      }

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
      if (!user.email) {
        return NextResponse.json({ error: 'User email is required' }, { status: 400 })
      }

      let newUser = null
      let createError = null
      
      try {
        const { data: userData, error: userCreateError } = await supabase
          .from('users')
          .insert({
            email: user.email,
            role: 'admin',
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        newUser = userData
        createError = userCreateError
      } catch (error) {
        console.log('Users table insert failed, trying profiles table')
        
        const { data: profileData, error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            role: 'admin',
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        newUser = profileData
        createError = profileCreateError
      }

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