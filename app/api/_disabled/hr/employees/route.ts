import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const EmployeeSchema = z.object({
  employee_code: z.string().optional(),
  full_name: z.string().min(2, 'Full name is required'),
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
    .default('active'),
  hire_date: z.string().optional(),
  salary: z.number().optional(),
  currency: z.string().default('USD'),
  work_location: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const department_id = searchParams.get('department_id');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    let query = supabase
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
        departments!inner(name)
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,employee_code.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    if (status) {
      query = query.eq('employment_status', status);
    }

    // Get total count for pagination
    const { count } = await query.select('*', { count: 'exact', head: true });

    // Get paginated results
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching employees:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employees' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/hr/employees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const parsed = EmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Generate employee code if not provided
    if (!parsed.data.employee_code) {
      const { data: lastEmployee } = await supabase
        .from('hr.employees')
        .select('employee_code')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      const lastCode = lastEmployee?.employee_code || 'EMP0000';
      const nextNumber = parseInt(lastCode.replace('EMP', '')) + 1;
      parsed.data.employee_code = `EMP${nextNumber.toString().padStart(4, '0')}`;
    }

    const { data, error } = await supabase
      .from('hr.employees')
      .insert(parsed.data)
      .select(
        `
        id, employee_code, full_name, first_name, last_name, 
        nationality, gender, date_of_birth, job_title, 
        department_id, manager_employee_id, phone, email, 
        personal_email, address, city, country, 
        employment_status, hire_date, salary, currency, 
        work_location, emergency_contact_name, 
        emergency_contact_phone, emergency_contact_relationship, 
        created_at, updated_at
      `
      )
      .single();

    if (error) {
      console.error('Error creating employee:', error);
      return NextResponse.json(
        { error: 'Failed to create employee' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/hr/employees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
