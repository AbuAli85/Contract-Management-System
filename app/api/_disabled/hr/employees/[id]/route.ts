import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

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
    const supabase = createClient();
    const employeeId = parseInt(params.id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
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
      .single();

    if (error) {
      console.error('Error fetching employee:', error);
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/hr/employees/[id]:', error);
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
    const supabase = createClient();
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

    const { data, error } = await supabase
      .from('hr.employees')
      .update(parsed.data)
      .eq('id', employeeId)
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
      console.error('Error updating employee:', error);
      return NextResponse.json(
        { error: 'Failed to update employee' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/hr/employees/[id]:', error);
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
    const supabase = createClient();
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
      console.error('Error deleting employee:', error);
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
    console.error('Error in DELETE /api/hr/employees/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
