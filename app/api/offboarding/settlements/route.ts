import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';
import { differenceInDays, differenceInMonths } from 'date-fns';

/**
 * POST /api/offboarding/settlements
 *
 * Calculate and create final settlement for departing employee
 */
export const POST = withAnyRBAC(
  ['company:manage:all', 'admin:all'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const {
        employer_employee_id,
        last_working_date,
        settlement_type,
        settlement_date,
      } = body;

      if (!employer_employee_id || !last_working_date || !settlement_type) {
        return NextResponse.json(
          {
            error:
              'Missing required fields: employer_employee_id, last_working_date, settlement_type',
          },
          { status: 400 }
        );
      }

      // Get employee details
      const { data: employee } = await supabase
        .from('employer_employees')
        .select(
          `
          id,
          employee_id,
          company_id,
          job_title,
          department,
          hire_date,
          salary,
          currency,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            email,
            full_name
          )
        `
        )
        .eq('id', employer_employee_id)
        .single();

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      // Calculate settlement components
      const hireDate = employee.hire_date
        ? new Date(employee.hire_date)
        : new Date();
      const lastWorkingDate = new Date(last_working_date);
      const serviceMonths = differenceInMonths(lastWorkingDate, hireDate);
      const serviceYears = serviceMonths / 12;

      // Get unused leave days
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('leave_type, start_date, end_date, status')
        .eq('employer_employee_id', employer_employee_id)
        .eq('status', 'approved');

      // Calculate unused leave (simplified - would need leave balance system)
      const unusedLeaveDays = 0; // Placeholder - would calculate from leave balance

      // Calculate leave encashment (if applicable)
      const dailySalary = employee.salary
        ? parseFloat(employee.salary) / 30
        : 0;
      const leaveEncashment = unusedLeaveDays * dailySalary;

      // Calculate notice period pay (if applicable)
      const noticePeriodPay = 0; // Would depend on contract terms

      // Calculate gratuity (if applicable - typically after 1 year)
      let gratuity = 0;
      if (serviceYears >= 1) {
        // Simplified gratuity calculation (would need actual policy)
        const monthlySalary = employee.salary ? parseFloat(employee.salary) : 0;
        gratuity = monthlySalary * serviceYears * 0.5; // Example: 0.5 month per year
      }

      // Calculate deductions (if any)
      const deductions = 0; // Would calculate from outstanding amounts

      // Calculate total settlement
      const finalSalary = employee.salary ? parseFloat(employee.salary) : 0;
      const totalSettlement =
        finalSalary + leaveEncashment + noticePeriodPay + gratuity - deductions;

      // Create settlement record
      const { data: settlement, error } = await supabase
        .from('final_settlements')
        .insert({
          employer_employee_id,
          company_id: employee.company_id,
          settlement_type,
          last_working_date,
          settlement_date:
            settlement_date || new Date().toISOString().split('T')[0],
          final_salary: finalSalary,
          unused_leave_days: unusedLeaveDays,
          leave_encashment: leaveEncashment,
          notice_period_pay: noticePeriodPay,
          gratuity,
          deductions,
          total_settlement: totalSettlement,
          currency: employee.currency || 'OMR',
          payment_status: 'pending',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create settlement', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          settlement,
          calculations: {
            serviceYears: serviceYears.toFixed(2),
            serviceMonths,
            unusedLeaveDays,
            dailySalary,
            leaveEncashment,
            noticePeriodPay,
            gratuity,
            deductions,
            totalSettlement,
          },
          message: 'Settlement calculated and created successfully',
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Error creating settlement:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
