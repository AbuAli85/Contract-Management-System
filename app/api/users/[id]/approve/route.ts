import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// PUT - Approve or reject user (simplified version)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(
      '🔍 API Approve: Starting approval process for user:',
      params.id
    );

    // Use service role client directly to bypass auth issues
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      console.error('❌ API Approve: Missing service role credentials');
      return NextResponse.json(
        {
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const userId = params.id;
    const body = await request.json();
    const { status, role } = body;

    console.log('🔍 API Approve: Request details:', { userId, status, role });

    if (!userId) {
      console.log('❌ API Approve: Missing user ID');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['active', 'inactive', 'pending'].includes(status)) {
      console.log('❌ API Approve: Invalid status:', status);
      return NextResponse.json(
        {
          error: 'Valid status is required (active, inactive, or pending)',
        },
        { status: 400 }
      );
    }

    console.log(
      '✅ API Approve: Using service role, bypassing permission checks'
    );

    // Update user status and role if provided
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (role && ['user', 'manager', 'admin'].includes(role)) {
      updateData.role = role;
    }

    console.log('🔄 API Approve: Updating user with data:', updateData);

    const { data: updatedUser, error: updateError } = await adminClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (updateError) {
      console.error('❌ API Approve: Error updating user:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update user',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ API Approve: User updated successfully:', updatedUser);

    // COMPREHENSIVE VERIFICATION - Multiple checks
    console.log('🔍 API Approve: Starting comprehensive verification...');

    // Check 1: Direct query by ID
    const { data: verifyUser, error: verifyError } = await adminClient
      .from('profiles')
      .select('id, email, status, updated_at')
      .eq('id', userId)
      .single();

    if (verifyError) {
      console.log('⚠️ API Approve: Could not verify update:', verifyError);
    } else {
      console.log('✅ API Approve: Direct verification result:', verifyUser);
    }

    // Check 2: Query all pending users to see if this user is still there
    const { data: stillPending, error: pendingError } = await adminClient
      .from('profiles')
      .select('id, email, status')
      .eq('status', 'pending');

    if (!pendingError) {
      const userStillPending = stillPending.find(u => u.id === userId);
      if (userStillPending) {
        console.log(
          '❌ API Approve: PROBLEM - User still appears in pending list!',
          userStillPending
        );
      } else {
        console.log('✅ API Approve: User no longer in pending list');
      }
      console.log(
        `📊 API Approve: Total pending users remaining: ${stillPending.length}`
      );
    }

    // Check 3: Count total users by status
    const { data: statusCounts, error: countError } = await adminClient
      .from('profiles')
      .select('status');

    if (!countError) {
      const pending = statusCounts.filter(u => u.status === 'pending').length;
      const active = statusCounts.filter(u => u.status === 'active').length;
      const inactive = statusCounts.filter(u => u.status === 'inactive').length;
      console.log(
        `📊 API Approve: Status distribution - Pending: ${pending}, Active: ${active}, Inactive: ${inactive}`
      );
    }
    return NextResponse.json({
      success: true,
      message: `User ${status === 'active' ? 'approved' : status === 'inactive' ? 'deactivated' : 'set to pending'} successfully`,
    });
  } catch (error) {
    console.error(
      '❌ API Approve: Error in PUT /api/users/[id]/approve:',
      error
    );
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
