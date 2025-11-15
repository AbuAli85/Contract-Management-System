import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 User Management API: Starting GET request');
    
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError.message }, { status: 401 });
    }
    
    if (!user) {
      console.error('❌ No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Authenticated user:', user.id);

    // Try to get user profile from users table first, then profiles table
    let userProfile = null;
    let tableName = 'users';
    
    // Try users table first
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (usersData) {
      userProfile = usersData;
      tableName = 'users';
      console.log('✅ Found user profile in users table');
    } else if (usersError) {
      console.log('⚠️ Users table query failed:', usersError.message, '- Trying profiles table...');
      
      // Try profiles table as fallback
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      if (profilesData) {
        userProfile = profilesData;
        tableName = 'profiles';
        console.log('✅ Found user profile in profiles table');
      } else {
        console.error('❌ Profiles table query failed:', profilesError);
        return NextResponse.json(
          { 
            error: 'User profile not found',
            details: `Failed to find user in both users and profiles tables. Users error: ${usersError?.message}, Profiles error: ${profilesError?.message}`
          },
          { status: 404 }
        );
      }
    }

    if (!userProfile) {
      console.error('❌ No user profile found');
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    console.log('👤 User role:', userProfile.role);

    // Check if user has admin privileges
    if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      console.error('❌ Insufficient permissions. Role:', userProfile?.role);
      return NextResponse.json(
        { error: 'Insufficient permissions', requiredRole: 'admin or super_admin', currentRole: userProfile?.role },
        { status: 403 }
      );
    }

    console.log('✅ Admin access granted. Fetching users from:', tableName);

    // Get all users from the appropriate table
    const selectFields = [
      'id',
      'email',
      'full_name',
      'role',
      'status',
      tableName === 'profiles' ? 'phone' : null,
      'created_at',
      'updated_at',
    ]
      .filter(Boolean)
      .join(', ');

    const { data: users, error: usersListError } = await supabase
      .from(tableName)
      .select(selectFields)
      .order('created_at', { ascending: false });

    if (usersListError) {
      console.error('❌ Error fetching users:', usersListError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch users',
          details: usersListError.message,
          code: usersListError.code,
          hint: usersListError.hint
        },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully fetched ${users?.length || 0} users`);

    return NextResponse.json({ 
      users: users || [],
      tableName,
      count: users?.length || 0
    });
  } catch (error) {
    console.error('❌ User management error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 User Management API: Starting POST request');
    
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError.message }, { status: 401 });
    }
    
    if (!user) {
      console.error('❌ No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Authenticated user:', user.id);

    // Try to get user profile from users table first, then profiles table
    let userProfile = null;
    let tableName = 'users';
    
    // Try users table first
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (usersData) {
      userProfile = usersData;
      tableName = 'users';
      console.log('✅ Found user profile in users table');
    } else if (usersError) {
      console.log('⚠️ Users table query failed:', usersError.message, '- Trying profiles table...');
      
      // Try profiles table as fallback
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      if (profilesData) {
        userProfile = profilesData;
        tableName = 'profiles';
        console.log('✅ Found user profile in profiles table');
      } else {
        console.error('❌ Profiles table query failed:', profilesError);
        return NextResponse.json(
          { 
            error: 'User profile not found',
            details: `Failed to find user in both users and profiles tables`
          },
          { status: 404 }
        );
      }
    }

    console.log('👤 User role:', userProfile?.role);

    // Check if user has admin privileges
    if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      console.error('❌ Insufficient permissions. Role:', userProfile?.role);
      return NextResponse.json(
        { error: 'Insufficient permissions', requiredRole: 'admin or super_admin', currentRole: userProfile?.role },
        { status: 403 }
      );
    }

    console.log('✅ Admin access granted. Using table:', tableName);

    const body = await request.json();
    const { action, userId, role, status } = body;
    
    console.log('📝 Action:', action, 'for user:', userId);

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'approve':
        // Update user status to active
        const { error: approveError } = await supabase
          .from(tableName)
          .update({
            status: 'active',
            role: role || 'user',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (approveError) {
          console.error('❌ Error approving user:', approveError);
          return NextResponse.json(
            { error: 'Failed to approve user', details: approveError.message },
            { status: 500 }
          );
        }

        // Update auth metadata
        try {
          const { error: authUpdateError } =
            await supabase.auth.admin.updateUserById(userId, {
              user_metadata: {
                role: role || 'user',
                status: 'active',
              },
            });

          if (authUpdateError) {
            console.warn('⚠️ Auth metadata update failed:', authUpdateError);
          } else {
            console.log('✅ Auth metadata updated successfully');
          }
        } catch (authError) {
          console.warn('⚠️ Auth update error (non-critical):', authError);
        }

        console.log('✅ User approved successfully');
        return NextResponse.json({ message: 'User approved successfully' });

      case 'reject':
        // Update user status to inactive
        const { error: rejectError } = await supabase
          .from(tableName)
          .update({
            status: 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (rejectError) {
          console.error('❌ Error rejecting user:', rejectError);
          return NextResponse.json(
            { error: 'Failed to reject user', details: rejectError.message },
            { status: 500 }
          );
        }

        console.log('✅ User rejected successfully');
        return NextResponse.json({ message: 'User rejected successfully' });

      case 'update_role':
        if (!role) {
          return NextResponse.json(
            { error: 'Role is required for update' },
            { status: 400 }
          );
        }

        const { error: roleUpdateError } = await supabase
          .from(tableName)
          .update({
            role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (roleUpdateError) {
          console.error('❌ Error updating user role:', roleUpdateError);
          return NextResponse.json(
            { error: 'Failed to update user role', details: roleUpdateError.message },
            { status: 500 }
          );
        }

        // Update auth metadata
        try {
          const { error: authRoleUpdateError } =
            await supabase.auth.admin.updateUserById(userId, {
              user_metadata: {
                role,
              },
            });

          if (authRoleUpdateError) {
            console.warn('⚠️ Auth metadata update failed:', authRoleUpdateError);
          } else {
            console.log('✅ Auth metadata updated successfully');
          }
        } catch (authError) {
          console.warn('⚠️ Auth update error (non-critical):', authError);
        }

        console.log('✅ User role updated successfully');
        return NextResponse.json({ message: 'User role updated successfully' });

      case 'update_status':
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required for update' },
            { status: 400 }
          );
        }

        const { error: statusUpdateError } = await supabase
          .from(tableName)
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (statusUpdateError) {
          console.error('❌ Error updating user status:', statusUpdateError);
          return NextResponse.json(
            { error: 'Failed to update user status', details: statusUpdateError.message },
            { status: 500 }
          );
        }

        console.log('✅ User status updated successfully');
        return NextResponse.json({
          message: 'User status updated successfully',
        });

      default:
        console.error('❌ Invalid action:', action);
        return NextResponse.json({ error: 'Invalid action', providedAction: action }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ User management POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
