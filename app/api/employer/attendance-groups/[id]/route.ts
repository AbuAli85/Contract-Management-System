import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { withRBAC } from '@/lib/rbac/guard';

export const dynamic = 'force-dynamic';

// GET - Get a specific group
export const GET = withRBAC(
  'attendance:read:all',
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const supabase = await createClient();
      const supabaseAdmin = getSupabaseAdmin();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.active_company_id) {
        return NextResponse.json(
          { error: 'No active company found' },
          { status: 400 }
        );
      }

      const { data: group, error } = await (
        supabaseAdmin.from('employee_attendance_groups') as any
      )
        .select(
          `
        *,
        office_location:office_location_id (
          id,
          name,
          address,
          latitude,
          longitude
        )
      `
        )
        .eq('id', params.id)
        .eq('company_id', profile.active_company_id)
        .single();

      if (error || !group) {
        return NextResponse.json(
          { error: 'Group not found', details: error?.message },
          { status: 404 }
        );
      }

      // Fetch employee assignments separately
      const { data: assignments, error: assignError } = await (
        supabaseAdmin.from('employee_group_assignments') as any
      )
        .select(
          `
        id,
        group_id,
        employer_employee_id,
        employer_employee:employer_employee_id (
          id,
          employee_code,
          job_title,
          department,
          employee_id
        )
      `
        )
        .eq('group_id', params.id);

      let employees = assignments || [];

      // Fetch profile data for employees
      if (employees.length > 0) {
        const employeeIds = [
          ...new Set(
            employees
              .map((a: any) => a.employer_employee?.employee_id)
              .filter(Boolean)
          ),
        ];

        if (employeeIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, email, phone')
            .in('id', employeeIds);

          const profileMap = new Map(
            profiles?.map((p: any) => [p.id, p]) || []
          );

          employees = employees.map((assignment: any) => {
            if (assignment.employer_employee?.employee_id) {
              assignment.employer_employee.employee = profileMap.get(
                assignment.employer_employee.employee_id
              );
            }
            return assignment;
          });
        }
      }

      return NextResponse.json({
        success: true,
        group: {
          ...group,
          employees,
          employee_count: employees.length,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// PUT - Update a group
export const PUT = withRBAC(
  'attendance:create:all',
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const supabase = await createClient();
      const supabaseAdmin = getSupabaseAdmin();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.active_company_id) {
        return NextResponse.json(
          { error: 'No active company found' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { employee_ids, ...updateData } = body;

      // Update the group
      const { data: group, error: updateError } = await (
        supabaseAdmin.from('employee_attendance_groups') as any
      )
        .update(updateData)
        .eq('id', params.id)
        .eq('company_id', profile.active_company_id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update group', details: updateError.message },
          { status: 500 }
        );
      }

      // Update employee assignments if provided
      if (Array.isArray(employee_ids)) {
        // Remove existing assignments
        await supabaseAdmin
          .from('employee_group_assignments')
          .delete()
          .eq('group_id', params.id);

        // Add new assignments
        if (employee_ids.length > 0) {
          const assignments: any[] = employee_ids.map((employeeId: string) => ({
            group_id: params.id,
            employer_employee_id: employeeId,
            assigned_by: user.id,
            is_primary: true,
          }));

          // @ts-ignore - Supabase type inference issue with admin client
          const assignmentsTable = supabaseAdmin.from(
            'employee_group_assignments'
          ) as any;
          const { error: assignError } =
            await assignmentsTable.insert(assignments);

          if (assignError) {
            // Don't fail the request, just log the error
          }
        }
      }

      return NextResponse.json({
        success: true,
        group,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// DELETE - Delete a group
export const DELETE = withRBAC(
  'attendance:create:all',
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const supabase = await createClient();
      const supabaseAdmin = getSupabaseAdmin();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.active_company_id) {
        return NextResponse.json(
          { error: 'No active company found' },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from('employee_attendance_groups')
        .delete()
        .eq('id', params.id)
        .eq('company_id', profile.active_company_id);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to delete group' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Group deleted successfully',
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
