import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

export const POST = withRBAC(
  'role:update:all',
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();

      // Get current user and verify they're admin
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { userIds, newRole } = await request.json();

      if (!userIds || !Array.isArray(userIds) || !newRole) {
        return NextResponse.json(
          { error: 'Invalid request data' },
          { status: 400 }
        );
      }

      // Update roles in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .in('id', userIds)
        .select();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update roles' },
          { status: 500 }
        );
      }


      return NextResponse.json({
        success: true,
        message: `Updated ${data.length} user roles to ${newRole}`,
        updated: data,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
