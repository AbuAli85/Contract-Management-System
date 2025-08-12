import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simple test endpoint to debug the approval issue
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST: Direct database approval test');

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Missing credentials' },
        { status: 500 }
      );
    }

    // Create service role client with RLS bypass
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // Explicitly disable RLS
      db: {
        schema: 'public',
      },
    });

    // Step 1: Get all users
    console.log('1. Getting all users...');
    const { data: allUsers, error: allError } = await supabase
      .from('profiles')
      .select('id, email, status, role, updated_at')
      .order('updated_at', { ascending: false });

    if (allError) {
      console.error('❌ Error getting all users:', allError);
      return NextResponse.json(
        { error: 'Failed to get users', details: allError },
        { status: 500 }
      );
    }

    console.log(`Found ${allUsers.length} total users`);

    // Step 2: Find pending users
    const pendingUsers = allUsers.filter(u => u.status === 'pending');
    console.log(`Found ${pendingUsers.length} pending users:`);
    pendingUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.id}) - ${user.status}`);
    });

    if (pendingUsers.length === 0) {
      return NextResponse.json({
        message: 'No pending users found',
        allUsers: allUsers.map(u => ({ email: u.email, status: u.status })),
      });
    }

    // Step 3: Try to approve the first pending user
    const userToApprove = pendingUsers[0];
    console.log(`2. Attempting to approve: ${userToApprove.email}`);

    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
        role: userToApprove.role, // Keep existing role
      })
      .eq('id', userToApprove.id)
      .select();

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return NextResponse.json(
        {
          error: 'Update failed',
          details: updateError,
          userToApprove,
        },
        { status: 500 }
      );
    }

    console.log('✅ Update successful:', updateResult);

    // Step 4: Verify the update
    const { data: verifyResult, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, status, updated_at')
      .eq('id', userToApprove.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return NextResponse.json(
        {
          error: 'Verification failed',
          details: verifyError,
          updateResult,
        },
        { status: 500 }
      );
    }

    console.log('✅ Verification result:', verifyResult);

    // Step 5: Check pending count again
    const { data: newPendingCheck, error: newPendingError } = await supabase
      .from('profiles')
      .select('id, email, status')
      .eq('status', 'pending');

    if (!newPendingError) {
      console.log(`Remaining pending users: ${newPendingCheck.length}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Direct database test completed',
      approvedUser: userToApprove.email,
      updateResult,
      verifyResult,
      remainingPending: newPendingCheck?.length || 0,
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
