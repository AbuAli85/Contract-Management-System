import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// GET - List payroll runs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const status = searchParams.get('status');
    const month = searchParams.get('month');

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    const targetCompanyId = companyId || profile?.active_company_id;

    if (!targetCompanyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('payroll_runs')
      .select('*')
      .eq('company_id', targetCompanyId)
      .order('payroll_month', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (month) {
      query = query.eq('payroll_month', month);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch payroll runs', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payroll_runs: data || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create and process payroll run
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      company_id,
      payroll_month,
      payroll_period = 'monthly',
      notes,
    } = body;

    // Get user profile to check permissions and get active company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, active_company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // Use active_company_id if company_id not provided
    const targetCompanyId = company_id || profile.active_company_id;

    // Validate required fields with detailed error messages
    if (!payroll_month) {
      return NextResponse.json(
        { error: 'payroll_month is required' },
        { status: 400 }
      );
    }

    if (!targetCompanyId) {
      return NextResponse.json(
        {
          error:
            'No company found. Please set an active company in your profile or provide a company_id',
          requires_company: true,
        },
        { status: 400 }
      );
    }

    // Check permissions
    const isAdmin = profile?.role === 'admin';
    const isHR = profile?.role === 'hr_manager' || profile?.role === 'manager';
    const isSameCompany = profile?.active_company_id === targetCompanyId;

    if (!isAdmin && !(isHR && isSameCompany)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. HR or Admin role required.' },
        { status: 403 }
      );
    }

    // Check if payroll run already exists for this month
    const { data: existing } = await supabase
      .from('payroll_runs')
      .select('id')
      .eq('company_id', targetCompanyId)
      .eq('payroll_month', payroll_month)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error: 'Payroll run already exists for this month',
          payroll_run_id: existing.id,
        },
        { status: 400 }
      );
    }

    // Get employer_id from company (via party relationship)
    // Company -> Party -> Party contact_email -> Profile ID (employer_id)
    let employerProfileId: string | null = null;

    const { data: company } = await supabase
      .from('companies')
      .select('party_id')
      .eq('id', targetCompanyId)
      .single();

    if (company?.party_id) {
      const { data: party } = await supabase
        .from('parties')
        .select('contact_email')
        .eq('id', company.party_id)
        .single();

      if (party?.contact_email) {
        const { data: employerProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', party.contact_email)
          .single();

        if (employerProfile) {
          employerProfileId = employerProfile.id;
        }
      }
    }

    // If we couldn't find employer from company, use the current user as fallback
    const effectiveEmployerId = employerProfileId || user.id;

    // Get all active employees for the employer
    let employeesQuery = (supabaseAdmin.from('employer_employees') as any)
      .select(
        `
        id,
        employee_id,
        employer_id,
        employee:profiles!employer_employees_employee_id_fkey(
          id,
          name_en,
          name_ar,
          email
        )
      `
      )
      .eq('employer_id', effectiveEmployerId)
      .eq('employment_status', 'active');

    // Also filter by company_id if it exists in the table (for backwards compatibility)
    // This uses .or() to include employees with null company_id
    employeesQuery = employeesQuery.or(
      `company_id.eq.${targetCompanyId},company_id.is.null`
    );

    const { data: employees, error: employeesError } = await employeesQuery;

    if (employeesError) {
      return NextResponse.json(
        { error: 'Failed to fetch employees', details: employeesError.message },
        { status: 500 }
      );
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { error: 'No active employees found for this company' },
        { status: 400 }
      );
    }

    // Create payroll run
    const { data: payrollRun, error: createError } = await (
      supabaseAdmin.from('payroll_runs') as any
    )
      .insert({
        company_id: targetCompanyId,
        payroll_month,
        payroll_period,
        status: 'draft',
        total_employees: employees.length,
        notes,
        processed_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create payroll run', details: createError.message },
        { status: 500 }
      );
    }

    // Process payroll entries for each employee
    const payrollEntries = [];
    let totalAmount = 0;
    let totalBasic = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;

    for (const employee of employees) {
      // Get active salary structure
      const { data: salaryStructure } = await supabase
        .from('salary_structures')
        .select('*')
        .eq('employer_employee_id', employee.id)
        .eq('status', 'active')
        .single();

      if (!salaryStructure) {
        continue;
      }

      // Calculate allowances total
      let allowancesTotal = 0;
      if (salaryStructure.allowances) {
        Object.values(
          salaryStructure.allowances as Record<string, number>
        ).forEach(val => {
          allowancesTotal +=
            typeof val === 'number' ? val : parseFloat(val as string);
        });
      }

      // Calculate deductions total
      let deductionsTotal = 0;
      if (salaryStructure.deductions) {
        Object.values(
          salaryStructure.deductions as Record<string, number>
        ).forEach(val => {
          deductionsTotal +=
            typeof val === 'number' ? val : parseFloat(val as string);
        });
      }

      // Get attendance data for the month
      const monthStart = new Date(payroll_month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Last day of month

      const { data: attendance } = await supabase
        .from('employee_attendance')
        .select('*')
        .eq('employer_employee_id', employee.id)
        .gte('attendance_date', monthStart.toISOString().split('T')[0])
        .lte('attendance_date', monthEnd.toISOString().split('T')[0]);

      const presentDays =
        attendance?.filter(a => a.status === 'present' || a.status === 'late')
          .length || 0;
      const absentDays =
        attendance?.filter(a => a.status === 'absent').length || 0;
      const leaveDays =
        attendance?.filter(a => a.status === 'leave').length || 0;
      const totalOvertimeHours =
        attendance?.reduce(
          (sum, a) => sum + (parseFloat(a.overtime_hours) || 0),
          0
        ) || 0;

      // Calculate overtime pay
      const hourlyRate = salaryStructure.basic_salary / (30 * 8); // Assuming 8 hours per day, 30 days per month
      const overtimePay =
        totalOvertimeHours *
        hourlyRate *
        (salaryStructure.overtime_rate || 1.5);

      // Calculate working days (assuming 30 days per month, adjust as needed)
      const workingDays = 30;
      const basicSalary =
        (salaryStructure.basic_salary / workingDays) * presentDays;

      const grossSalary = basicSalary + allowancesTotal + overtimePay;
      const netSalary = grossSalary - deductionsTotal;

      totalAmount += netSalary;
      totalBasic += basicSalary;
      totalAllowances += allowancesTotal;
      totalDeductions += deductionsTotal;

      payrollEntries.push({
        payroll_run_id: payrollRun.id,
        employer_employee_id: employee.id,
        salary_structure_id: salaryStructure.id,
        basic_salary: basicSalary,
        allowances: allowancesTotal,
        deductions: deductionsTotal,
        overtime_hours: totalOvertimeHours,
        overtime_pay: overtimePay,
        bonus: 0,
        working_days: workingDays,
        present_days: presentDays,
        absent_days: absentDays,
        leave_days: leaveDays,
        payment_status: 'pending',
      });
    }

    // Insert all payroll entries
    if (payrollEntries.length > 0) {
      const { error: entriesError } = await (
        supabaseAdmin.from('payroll_entries') as any
      ).insert(payrollEntries);

      if (entriesError) {
        // Continue anyway, entries can be added later
      }
    }

    // Update payroll run totals
    const { data: updatedRun, error: updateError } = await (
      supabaseAdmin.from('payroll_runs') as any
    )
      .update({
        total_amount: totalAmount,
        total_basic_salary: totalBasic,
        total_allowances: totalAllowances,
        total_deductions: totalDeductions,
        total_overtime: payrollEntries.reduce(
          (sum, e) => sum + (e.overtime_pay || 0),
          0
        ),
      })
      .eq('id', payrollRun.id)
      .select()
      .single();

    if (updateError) {
    }

    return NextResponse.json({
      success: true,
      message: 'Payroll run created successfully',
      payroll_run: updatedRun || payrollRun,
      entries_count: payrollEntries.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
