import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// GET - Fetch pending users for approval (simplified admin check)
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 User approval API called');
    
    // Add more detailed logging
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    
    const supabase = await createClient();
    console.log('🔧 Supabase client created successfully');

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('🔍 Auth check result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      authErrorCode: authError?.code,
    });

    if (authError || !user) {
      console.log('❌ Authentication failed:', {
        authError: authError?.message,
        authErrorCode: authError?.code,
        hasUser: !!user,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Check if user has admin permissions - try profiles table first, then users table
    let userRole = null;
    let profileError = null;
    
    // First try to get role from profiles table
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profileErr && profileData?.role) {
        userRole = profileData.role;
        console.log('✅ Role found in profiles table:', userRole);
      } else {
        profileError = profileErr;
        console.log('⚠️ No role in profiles table, trying users table...');
      }
    } catch (err) {
      console.log('⚠️ Profiles table query failed, trying users table...');
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
          console.log('✅ Role found in users table:', userRole);
        } else {
          console.log('⚠️ No role in users table either');
        }
      } catch (err) {
        console.log('⚠️ Users table query also failed');
      }
    }

    console.log('👤 Role check result:', {
      userRole,
      profileError: profileError?.message,
    });

    if (!userRole || userRole !== 'admin') {
      console.log('❌ User is not admin:', userRole);
      return NextResponse.json(
        { error: 'Only admins can view pending users' },
        { status: 403 }
      );
    }

    // Use admin client for admin operations to bypass RLS policies
    const adminClient = getSupabaseAdmin();
    console.log('🔑 Using admin client for database operations');
    
    // Test admin client connection
    try {
      const { data: testData, error: testError } = await adminClient
        .from('users')
        .select('count')
        .limit(1);
      
      console.log('🔑 Admin client test:', {
        success: !testError,
        error: testError?.message,
        errorCode: testError?.code,
      });
      
      if (testError) {
        console.error('❌ Admin client connection failed:', testError);
        return NextResponse.json(
          { error: 'Admin database access failed', details: testError.message },
          { status: 500 }
        );
      }
    } catch (testErr) {
      console.error('❌ Admin client test exception:', testErr);
      return NextResponse.json(
        { error: 'Admin client test failed', details: testErr instanceof Error ? testErr.message : 'Unknown error' },
        { status: 500 }
      );
    }

    console.log('✅ User is admin, proceeding to fetch pending users');

    // Fetch pending users
    console.log('📋 Fetching pending users from database...');
    
    let pendingUsers: any[] = [];
    
    try {
      // First, let's check if the users table exists and has any data
      const { data: tableCheck, error: tableError } = await adminClient
        .from('users')
        .select('count')
        .limit(1);
      
      console.log('📋 Table check result:', {
        hasTable: !tableError,
        tableError: tableError?.message,
        tableErrorCode: tableError?.code,
      });
      
      if (tableError) {
        console.error('❌ Users table access error:', {
          message: tableError.message,
          code: tableError.code,
          details: tableError.details,
          hint: tableError.hint,
        });
        
        // Try to provide helpful error message
        if (tableError.code === '42P01') {
          return NextResponse.json(
            { error: 'Users table does not exist', details: 'Database schema issue detected' },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { error: 'Database access error', details: tableError.message },
          { status: 500 }
        );
      }
      
      // Now fetch pending users - only select columns that exist
      const { data, error } = await adminClient
        .from('users')
        .select('*')  // Select all available columns to avoid schema mismatch
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      pendingUsers = data || [];

      console.log('📋 Database query result:', {
        hasData: !!data,
        dataLength: data?.length || 0,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
      });

      if (error) {
        console.error('❌ Error fetching pending users:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return NextResponse.json(
          { error: 'Failed to fetch pending users', details: error.message },
          { status: 500 }
        );
      }

      // If no pending users found, let's check if there are any users at all
      if (!data || data.length === 0) {
        console.log('📋 No pending users found, checking if table has any users...');
        
        try {
          const { data: allUsers, error: allUsersError } = await adminClient
            .from('users')
            .select('*')
            .limit(10);
          
          console.log('📋 All users check:', {
            hasUsers: !!allUsers,
            userCount: allUsers?.length || 0,
            error: allUsersError?.message,
            sampleUsers: allUsers?.map(u => ({ id: u.id, email: u.email, role: u.role, status: u.status })) || [],
          });
        } catch (allUsersErr) {
          console.log('📋 All users check failed:', allUsersErr);
        }
      }
    } catch (dbError) {
      console.error('❌ Database query exception:', dbError);
      return NextResponse.json(
        { error: 'Database query failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    console.log(
      '✅ Successfully fetched pending users:',
      pendingUsers?.length || 0
    );
    console.log(
      '📋 Pending users:',
      pendingUsers?.map((u: any) => ({
        email: u.email,
        role: u.role,
        status: u.status,
      }))
    );

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

// POST - Approve or reject users (simplified admin check)
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
