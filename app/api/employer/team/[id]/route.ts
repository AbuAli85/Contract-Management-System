import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get employee details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employerEmployeeId } = await params;
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: employeeRecord, error: fetchError } = await supabase
      .from('employer_employees')
      .select(`
        *,
        employee:profiles!employer_employees_employee_id_fkey(
          id, email, full_name, first_name, last_name, phone, avatar_url
        )
      `)
      .eq('id', employerEmployeeId)
      .eq('employer_id', user.id)
      .single();

    if (fetchError || !employeeRecord) {
      return NextResponse.json(
        { error: 'Employee not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee: employeeRecord });
  } catch (error) {
    console.error('Error in GET /api/employer/team/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update employee details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employerEmployeeId } = await params;
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify this employer_employee belongs to the current employer
    const { data: employeeRecord, error: fetchError } = await supabase
      .from('employer_employees')
      .select('id, employee_id, employer_id')
      .eq('id', employerEmployeeId)
      .eq('employer_id', user.id)
      .single();

    if (fetchError || !employeeRecord) {
      return NextResponse.json(
        { error: 'Employee not found or access denied' },
        { status: 404 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Extract profile fields and employment fields
    const {
      email,
      full_name,
      first_name,
      last_name,
      phone,
      job_title,
      department,
      employment_type,
      employee_code,
    } = body;

    // Update profile if profile fields provided
    if (email || full_name || first_name || last_name || phone) {
      const profileUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (email) profileUpdate.email = email.toLowerCase();
      if (full_name) profileUpdate.full_name = full_name;
      if (first_name) profileUpdate.first_name = first_name;
      if (last_name) profileUpdate.last_name = last_name;
      if (phone) profileUpdate.phone = phone;

      const { error: profileError } = await (supabaseAdmin.from('profiles') as any)
        .update(profileUpdate)
        .eq('id', employeeRecord.employee_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to update profile', details: profileError.message },
          { status: 500 }
        );
      }

      // Also update email in Supabase Auth if changed
      if (email) {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
          employeeRecord.employee_id,
          { email: email.toLowerCase() }
        );

        if (authUpdateError) {
          console.error('Error updating auth email:', authUpdateError);
          // Don't fail the request, just log it
        }
      }
    }

    // Update promoters table if exists
    if (email || full_name || phone) {
      const promoterUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (email) promoterUpdate.email = email.toLowerCase();
      if (full_name) {
        const nameParts = full_name.split(' ');
        promoterUpdate.name_en = full_name;
        promoterUpdate.first_name = nameParts[0];
        promoterUpdate.last_name = nameParts.slice(1).join(' ') || '';
      }
      if (phone) promoterUpdate.phone = phone;

      await (supabaseAdmin.from('promoters') as any)
        .update(promoterUpdate)
        .eq('id', employeeRecord.employee_id);
    }

    // Update employer_employees if employment fields provided
    if (job_title !== undefined || department !== undefined || employment_type || employee_code) {
      const employmentUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (job_title !== undefined) employmentUpdate.job_title = job_title;
      if (department !== undefined) employmentUpdate.department = department;
      if (employment_type) employmentUpdate.employment_type = employment_type;
      if (employee_code) employmentUpdate.employee_code = employee_code;

      const { error: employmentError } = await supabase
        .from('employer_employees')
        .update(employmentUpdate)
        .eq('id', employerEmployeeId);

      if (employmentError) {
        console.error('Error updating employment:', employmentError);
        return NextResponse.json(
          { error: 'Failed to update employment details', details: employmentError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/employer/team/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
