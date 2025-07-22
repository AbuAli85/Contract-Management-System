import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all users
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || !['admin', 'manager'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch all users
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        department,
        position,
        phone,
        avatar_url,
        created_at,
        last_login
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Error in GET /api/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new user with password
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      email, 
      password, 
      full_name, 
      role, 
      status, 
      department, 
      position, 
      phone 
    } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json({ 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      }, { status: 400 })
    }

    // Check if user already exists in database
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Create user in database first
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        full_name: full_name || null,
        role: role || 'user',
        status: status || 'active',
        department: department || null,
        position: position || null,
        phone: phone || null,
        created_at: new Date().toISOString(),
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user in database:', createError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    if (!newUser) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create user in Supabase Auth
    const { data: authUser, error: createAuthError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        role,
        status,
        department,
        position,
        phone
      }
    })

    if (createAuthError) {
      console.error('Error creating user in auth:', createAuthError)
      // Try to delete the database user if auth creation fails
      await supabase
        .from('users')
        .delete()
        .eq('id', newUser.id)
      return NextResponse.json({ error: 'Failed to create user in authentication' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name,
        role,
        status,
        department,
        position,
        phone
      }
    })

  } catch (error) {
    console.error('Error in POST /api/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, ...updateData } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user has permissions to update this user
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Only allow admins to update other users, or users to update their own profile
    if (userProfile.role !== 'admin' && user.id !== userId) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: updateData.full_name,
        role: updateData.role,
        status: updateData.status,
        department: updateData.department,
        position: updateData.position,
        phone: updateData.phone,
        avatar_url: updateData.avatar_url
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in PUT /api/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete users' }, { status: 403 })
    }

    // Prevent admin from deleting themselves
    if (user.id === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete user from database first
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Error deleting user from database:', deleteError)
      return NextResponse.json({ error: 'Failed to delete user from database' }, { status: 500 })
    }

    // Try to delete user from auth (this might fail if user doesn't exist in auth)
    try {
      await supabase.auth.admin.deleteUser(userId)
    } catch (authDeleteError) {
      console.warn('Could not delete user from auth (might not exist):', authDeleteError)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 