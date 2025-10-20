import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// GET - Fetch pending users for approval
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    let userRole = null;

    // Try to get role from profiles table first
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profileErr && profileData?.role) {
        userRole = profileData.role;
      }
    } catch (err) {
      // Continue to users table if profiles fails
    }

    // If no role from profiles, try users table
    if (!userRole) {
      try {
        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!userErr && userData?.role) {
          userRole = userData.role;
        }
      } catch (err) {
        // Both tables failed
      }
    }

    if (!userRole || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view pending users' },
        { status: 403 }
      );
    }

    // Use admin client for admin operations
    const adminClient = getSupabaseAdmin();

    // Fetch pending users
    const { data: pendingUsers, error } = await adminClient
      .from('users')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pendingUsers: pendingUsers || [],
    });
  } catch (error) {
    console.error('Error in GET /api/users/approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Approve or reject users
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can approve/reject users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action, role, department, position, notes } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get the user to be approved/rejected
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.status !== 'pending') {
      return NextResponse.json(
        { error: 'User is not in pending status' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status: action === 'approve' ? 'active' : 'inactive',
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    // If approving, set the role and other details
    if (action === 'approve') {
      updateData.role = role || 'user';
      if (department) updateData.department = department;
      if (position) updateData.position = position;
    }

    // Update user status
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase.from('user_activity_log').insert({
      user_id: user.id,
      action: `user_${action}`,
      resource_type: 'user',
      resource_id: userId,
      details: {
        target_user_email: targetUser.email,
        target_user_name: targetUser.full_name,
        action,
        role,
        department,
        position,
        notes,
      },
    });

    // If approving, also update auth user metadata
    if (action === 'approve') {
      try {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            role: role || 'user',
            status: 'active',
            department,
            position,
          },
        });
      } catch (authError) {
        console.warn('Failed to update auth user metadata:', authError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${action}d successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error in POST /api/users/approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
