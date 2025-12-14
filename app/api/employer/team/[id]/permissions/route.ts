import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Get employee permissions
async function getEmployeePermissionsHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params; // employer_employee_id
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access
    const { data: teamMember, error: fetchError } = await supabase
      .from('employer_employees')
      .select('employer_id, employee_id')
      .eq('id', id)
      .single();

    if (fetchError || !teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    const isEmployer = teamMember.employer_id === user.id;
    const isEmployee = teamMember.employee_id === user.id;
    const isAdmin = await checkIsAdmin(user.id, supabase);

    if (!isEmployer && !isEmployee && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get permissions
    const { data: permissions, error: permError } = await supabase
      .from('employee_permissions')
      .select('*')
      .eq('employer_employee_id', id);

    if (permError) {
      console.error('Error fetching permissions:', permError);
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permissions: permissions || [],
    });
  } catch (error) {
    console.error('Error in GET /api/employer/team/[id]/permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Assign permissions to employee
async function assignPermissionsHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params; // employer_employee_id
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { permissions } = body; // Array of permission IDs

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    // Verify user is the employer
    const { data: teamMember, error: fetchError } = await supabase
      .from('employer_employees')
      .select('employer_id')
      .eq('id', id)
      .single();

    if (fetchError || !teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    if (teamMember.employer_id !== user.id) {
      const isAdmin = await checkIsAdmin(user.id, supabase);
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only employer or admin can assign permissions' },
          { status: 403 }
        );
      }
    }

    // Delete existing permissions
    await supabase
      .from('employee_permissions')
      .delete()
      .eq('employer_employee_id', id);

    // Insert new permissions
    if (permissions.length > 0) {
      const permissionRecords = permissions.map(permission_id => ({
        employer_employee_id: id,
        permission_id,
        granted: true,
        granted_by: user.id,
      }));

      const { error: insertError } = await supabase
        .from('employee_permissions')
        .insert(permissionRecords);

      if (insertError) {
        console.error('Error assigning permissions:', insertError);
        return NextResponse.json(
          { error: 'Failed to assign permissions', details: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Permissions assigned successfully',
      permissions,
    });
  } catch (error) {
    console.error('Error in POST /api/employer/team/[id]/permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkIsAdmin(userId: string, supabase: any): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role === 'admin' || profile?.role === 'manager';
}

// Export handlers directly - internal authorization is already implemented
export const GET = getEmployeePermissionsHandler;
export const POST = assignPermissionsHandler;

