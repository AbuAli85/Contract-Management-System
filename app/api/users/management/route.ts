import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all users with their profiles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        phone,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('User management error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId, role, status } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    switch (action) {
      case 'approve':
        // Update user status to active
        const { error: approveError } = await supabase
          .from('users')
          .update({ 
            status: 'active',
            role: role || 'user',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (approveError) {
          console.error('Error approving user:', approveError);
          return NextResponse.json({ error: 'Failed to approve user' }, { status: 500 });
        }

        // Update auth metadata
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            role: role || 'user',
            status: 'active'
          }
        });

        if (authUpdateError) {
          console.warn('Auth metadata update failed:', authUpdateError);
        }

        return NextResponse.json({ message: 'User approved successfully' });

      case 'reject':
        // Update user status to inactive
        const { error: rejectError } = await supabase
          .from('users')
          .update({ 
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (rejectError) {
          console.error('Error rejecting user:', rejectError);
          return NextResponse.json({ error: 'Failed to reject user' }, { status: 500 });
        }

        return NextResponse.json({ message: 'User rejected successfully' });

      case 'update_role':
        if (!role) {
          return NextResponse.json({ error: 'Role is required for update' }, { status: 400 });
        }

        const { error: roleUpdateError } = await supabase
          .from('users')
          .update({ 
            role,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (roleUpdateError) {
          console.error('Error updating user role:', roleUpdateError);
          return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
        }

        // Update auth metadata
        const { error: authRoleUpdateError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            role
          }
        });

        if (authRoleUpdateError) {
          console.warn('Auth metadata update failed:', authRoleUpdateError);
        }

        return NextResponse.json({ message: 'User role updated successfully' });

      case 'update_status':
        if (!status) {
          return NextResponse.json({ error: 'Status is required for update' }, { status: 400 });
        }

        const { error: statusUpdateError } = await supabase
          .from('users')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (statusUpdateError) {
          console.error('Error updating user status:', statusUpdateError);
          return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
        }

        return NextResponse.json({ message: 'User status updated successfully' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('User management error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}