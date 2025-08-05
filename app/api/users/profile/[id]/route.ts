import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/types/custom'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetUserId = params.id

    // Check if user is admin or requesting their own profile
    const isAdmin = user.user_metadata?.role === 'admin'
    const isOwnProfile = targetUserId === user.id

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    // Get user profile from profiles table with explicit error handling
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single()

    // Handle profile not found with better error logging
    if (profileError) {
      console.error('Profile fetch error:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })

      if (profileError.code === 'PGRST116') {
        console.log('Profile not found, attempting to create one...')
        
        // Get user from auth.users for additional data
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(targetUserId)

        if (authError) {
          console.error('Error fetching auth user:', authError)
          return NextResponse.json({ error: 'User not found in authentication system' }, { status: 404 })
        }

      // Create a new profile
      const newProfile = {
        id: targetUserId,
        email: authUser.user?.email || '',
        full_name: authUser.user?.user_metadata?.full_name || null,
        avatar_url: authUser.user?.user_metadata?.avatar_url || null,
        role: authUser.user?.user_metadata?.role || 'user',
        created_at: authUser.user?.created_at || new Date().toISOString(),
        last_login: authUser.user?.last_sign_in_at || null
      }

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        // Return fallback profile from auth data
        const fallbackProfile: UserProfile = {
          id: targetUserId,
          email: authUser.user?.email || '',
          full_name: authUser.user?.user_metadata?.full_name || null,
          avatar_url: authUser.user?.user_metadata?.avatar_url || null,
          role: authUser.user?.user_metadata?.role || 'user',
          created_at: authUser.user?.created_at || null,
          last_login: authUser.user?.last_sign_in_at || null
        }
        return NextResponse.json(fallbackProfile)
      }

      return NextResponse.json(createdProfile)
    }

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get user from auth.users for additional data
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(targetUserId)

    if (authError) {
      console.error('Error fetching auth user:', authError)
    }

    // Combine profile data with auth data - prioritize profiles table data
    const userProfile: UserProfile = {
      id: profile.id,
      email: authUser?.user?.email || profile.email || '',
      full_name: profile.full_name || authUser?.user?.user_metadata?.full_name || null,
      avatar_url: profile.avatar_url || authUser?.user?.user_metadata?.avatar_url || null,
      role: profile.role || 'user', // Always use profiles table role, fallback to 'user' if null
      created_at: profile.created_at || authUser?.user?.created_at || null,
      last_login: profile.last_login || authUser?.user?.last_sign_in_at || null
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('User profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetUserId = params.id

    // Check if user is admin or updating their own profile
    const isAdmin = user.user_metadata?.role === 'admin'
    const isOwnProfile = targetUserId === user.id

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, avatar_url, role } = body

    // Prepare update data
    const updateData: any = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (role !== undefined && isAdmin) updateData.role = role // Only admins can update roles

    // Update profile in profiles table
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', targetUserId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Update auth user metadata if name or avatar changed
    if (full_name !== undefined || avatar_url !== undefined) {
      const metadata: any = {}
      if (full_name !== undefined) metadata.full_name = full_name
      if (avatar_url !== undefined) metadata.avatar_url = avatar_url

      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(targetUserId, {
        user_metadata: metadata
      })

      if (authUpdateError) {
        console.error('Error updating auth metadata:', authUpdateError)
      }
    }

    // Return updated profile
    const userProfile: UserProfile = {
      id: updatedProfile.id,
      email: updatedProfile.email || '',
      full_name: updatedProfile.full_name,
      avatar_url: updatedProfile.avatar_url,
      role: updatedProfile.role,
      created_at: updatedProfile.created_at,
      last_login: updatedProfile.last_login
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('User profile PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 