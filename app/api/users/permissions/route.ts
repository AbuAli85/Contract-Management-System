import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// GET - Fetch all permissions
export const GET = withRBAC(
  'permission:manage:all',
  async (request: NextRequest) => {
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
          { error: 'Only admins can view permissions' },
          { status: 403 }
        );
      }

      // Fetch all permissions
      const { data: permissions, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category')
        .order('name');

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        return NextResponse.json(
          { error: 'Failed to fetch permissions' },
          { status: 500 }
        );
      }

      // Transform the data to match the expected format
      const transformedPermissions =
        permissions?.map(permission => ({
          id: permission.id,
          name: permission.name,
          description: permission.description,
          category: permission.category,
          isSystem: true, // All permissions in the permissions table are system permissions
        })) || [];

      return NextResponse.json({
        success: true,
        permissions: transformedPermissions,
      });
    } catch (error) {
      console.error('Error in GET /api/users/permissions:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
