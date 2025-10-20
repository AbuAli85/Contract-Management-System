import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

// ✅ SECURITY FIX: Added RBAC guard and authentication for user approval
export const PUT = withRBAC(
  'user:approve',
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const userId = params.id;
      const body = await request.json();
      const { status, role } = body;

      console.log('🔍 API Approve: Request details:', { userId, status, role });

      // Use authenticated client with RLS
      const supabase = await createClient();

      // Verify the requester is authenticated and is an admin
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        );
      }

      // Verify requester is admin
      const { data: requesterProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if ((requesterProfile as any)?.role !== 'admin') {
        console.log('❌ API Approve: User is not admin:', user.email);
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }

      // Validate inputs
      if (!status || !['active', 'inactive', 'pending'].includes(status)) {
        return NextResponse.json(
          { error: 'Valid status is required (active, inactive, or pending)' },
          { status: 400 }
        );
      }

      // Validate role if provided (restrict to safe roles)
      const allowedRoles = ['user', 'provider', 'client', 'admin'];
      if (role && !allowedRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      // Update user status and role if provided
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (role) {
        updateData.role = role;
      }

      console.log('🔄 API Approve: Updating user with data:', updateData);

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
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

      // Create audit log
      try {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'user_approval',
          table_name: 'users',
          record_id: userId,
          old_values: { status: 'pending' },
          new_values: updateData,
          created_at: new Date().toISOString(),
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }

      console.log('✅ API Approve: User updated successfully');

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: `User ${status === 'active' ? 'approved' : status === 'inactive' ? 'deactivated' : 'set to pending'} successfully`,
      });
    } catch (error) {
      console.error('❌ API Approve: Error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);
