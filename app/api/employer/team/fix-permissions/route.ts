/**
 * Fix Permissions API
 *
 * This endpoint allows employers to fix permissions for their employees
 * by ensuring they have the 'promoter' role assigned.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensurePromoterRole } from '@/lib/services/employee-account-service';

export const dynamic = 'force-dynamic';

// Export the ensurePromoterRole function so it can be used
export { ensurePromoterRole };

/**
 * POST - Fix permissions for a specific employee or all employees
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an employer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isEmployer =
      profile?.role === 'employer' ||
      profile?.role === 'admin' ||
      profile?.role === 'manager';

    if (!isEmployer) {
      return NextResponse.json(
        { error: 'Only employers can fix employee permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { employeeId, fixAll = false } = body;

    if (fixAll) {
      // Fix permissions for all employees of this employer
      const { data: employees, error: fetchError } = await supabase
        .from('employer_employees')
        .select('employee_id')
        .eq('employer_id', user.id)
        .eq('employment_status', 'active');

      if (fetchError) {
        return NextResponse.json(
          { error: 'Failed to fetch employees', details: fetchError.message },
          { status: 500 }
        );
      }

      const results = [];
      for (const employee of employees || []) {
        try {
          await ensurePromoterRole(employee.employee_id);
          results.push({ employeeId: employee.employee_id, success: true });
        } catch (error: any) {
          results.push({
            employeeId: employee.employee_id,
            success: false,
            error: error.message,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Fixed permissions for ${results.filter(r => r.success).length} employees`,
        results,
      });
    } else if (employeeId) {
      // Fix permissions for a specific employee
      // Verify the employee belongs to this employer
      const { data: employeeRecord, error: fetchError } = await supabase
        .from('employer_employees')
        .select('employee_id')
        .eq('id', employeeId)
        .eq('employer_id', user.id)
        .single();

      if (fetchError || !employeeRecord) {
        return NextResponse.json(
          { error: 'Employee not found or access denied' },
          { status: 404 }
        );
      }

      await ensurePromoterRole(employeeRecord.employee_id);

      return NextResponse.json({
        success: true,
        message: 'Permissions fixed successfully',
        employeeId: employeeRecord.employee_id,
      });
    } else {
      return NextResponse.json(
        { error: 'Either employeeId or fixAll must be provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
