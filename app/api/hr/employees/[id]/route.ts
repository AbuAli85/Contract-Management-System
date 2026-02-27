import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getCompanyRole } from '@/lib/auth/get-company-role';

const EmployeeUpdateSchema = z.object({
  employee_code: z.string().optional(),
  full_name: z.string().min(2).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  nationality: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  date_of_birth: z.string().optional(),
  job_title: z.string().optional(),
  department_id: z.number().optional(),
  manager_employee_id: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  personal_email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  employment_status: z
    .enum(['active', 'probation', 'on_leave', 'terminated'])
    .optional(),
  hire_date: z.string().optional(),
  termination_date: z.string().optional(),
  salary: z.number().optional(),
  currency: z.string().optional(),
  work_location: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const employeeId = parseInt(params.id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    const { companyId } = await getCompanyRole(supabase);
    if (!companyId) {
      return NextResponse.json(
        { error: 'No active company selected' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('hr.employees')
      .select(
        `
        id, employee_code, full_name, first_name, last_name, 
        nationality, gender, date_of_birth, job_title, 
        department_id, manager_employee_id, phone, email, 
        personal_email, address, city, country, 
        employment_status, hire_date, termination_date, 
        salary, currency, work_location, 
        emergency_contact_name, emergency_contact_phone, 
        emergency_contact_relationship, created_at, updated_at,
        departments!inner(name),
        manager:hr.employees!manager_employee_id(id, full_name, employee_code)
      `
      )
      .eq('id', employeeId)
      .eq('company_id', companyId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const employeeId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    const parsed = EmployeeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { companyId } = await getCompanyRole(supabase);
    if (!companyId) {
      return NextResponse.json(
        { error: 'No active company selected' },
        { status: 400 }
      );
    }

    // Manager integrity validation
    const updatePayload: any = { ...parsed.data };

    // Prevent self-manager assignment
    if (
      typeof updatePayload.manager_employee_id === 'number' &&
      updatePayload.manager_employee_id === employeeId
    ) {
      return NextResponse.json(
        { error: 'Employee cannot be their own manager' },
        { status: 400 }
      );
    }

    // Validate manager_employee_id belongs to same company and avoid simple cycles
    if (typeof updatePayload.manager_employee_id === 'number') {
      const { data: managerEmployee, error: managerError } = await supabase
        .from('hr.employees')
        .select('id, company_id, manager_employee_id')
        .eq('id', updatePayload.manager_employee_id)
        .maybeSingle();

      if (managerError || !managerEmployee) {
        return NextResponse.json(
          { error: 'Manager employee not found' },
          { status: 400 }
        );
      }

      if (managerEmployee.company_id !== companyId) {
        return NextResponse.json(
          {
            error: 'Manager must belong to the same company as the employee',
          },
          { status: 400 }
        );
      }

      if (managerEmployee.manager_employee_id === employeeId) {
        return NextResponse.json(
          {
            error:
              'Invalid manager assignment: circular relationship detected (one-level cycle)',
          },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from('hr.employees')
      .update(updatePayload)
      .eq('id', employeeId)
      .eq('company_id', companyId)
      .select(
        `
        id, employee_code, full_name, first_name, last_name, 
        nationality, gender, date_of_birth, job_title, 
        department_id, manager_employee_id, phone, email, 
        personal_email, address, city, country, 
        employment_status, hire_date, termination_date, 
        salary, currency, work_location, 
        emergency_contact_name, emergency_contact_phone, 
        emergency_contact_relationship, created_at, updated_at
      `
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update employee' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const employeeId = parseInt(params.id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    // Soft delete by updating employment status
    const { data, error } = await supabase
      .from('hr.employees')
      .update({
        employment_status: 'terminated',
        termination_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', employeeId)
      .select('id, full_name, employment_status')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete employee' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Employee terminated successfully',
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
