import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get single assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const { data: assignment, error } = await (supabaseAdmin.from('client_assignments') as any)
      .select(`
        *,
        employer_employee:employer_employee_id (
          id,
          employee_id,
          employer_id,
          company_id,
          job_title,
          employee:employee_id (
            id,
            name_en,
            name_ar,
            email
          )
        ),
        client:client_party_id (
          id,
          name_en,
          name_ar,
          email,
          phone,
          address
        ),
        deployment_letter:deployment_letter_id (
          id,
          contract_number,
          status,
          pdf_url
        )
      `)
      .eq('id', id)
      .single();

    if (error || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Verify access
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      const employee = assignment.employer_employee;
      if (
        employee.employer_id !== user.id &&
        employee.employee_id !== user.id
      ) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Company scoping
      if (employee.company_id !== userProfile?.active_company_id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error('Error in GET /api/hr/assignments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // Get existing assignment
    const { data: existingAssignment } = await (supabaseAdmin.from('client_assignments') as any)
      .select(`
        *,
        employer_employee:employer_employee_id (
          id,
          employer_id,
          company_id
        )
      `)
      .eq('id', id)
      .single();

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Verify access
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      const employee = existingAssignment.employer_employee;
      if (employee.employer_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - Only employer or admin can update assignments' },
          { status: 403 }
        );
      }

      // Company scoping
      if (employee.company_id !== userProfile?.active_company_id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Allow updating these fields
    if (body.job_title !== undefined) updateData.job_title = body.job_title;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.work_location !== undefined) updateData.work_location = body.work_location;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;
    if (body.assignment_terms !== undefined) updateData.assignment_terms = body.assignment_terms;
    if (body.client_contact_person !== undefined) updateData.client_contact_person = body.client_contact_person;
    if (body.client_contact_email !== undefined) updateData.client_contact_email = body.client_contact_email;
    if (body.client_contact_phone !== undefined) updateData.client_contact_phone = body.client_contact_phone;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Status updates
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'terminated') {
        updateData.terminated_at = new Date().toISOString();
        if (body.termination_reason) {
          updateData.termination_reason = body.termination_reason;
        }
      }
    }

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await (supabaseAdmin.from('client_assignments') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating assignment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update assignment', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error('Error in PUT /api/hr/assignments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete assignment (soft delete by setting status to terminated)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // Get existing assignment
    const { data: existingAssignment } = await (supabaseAdmin.from('client_assignments') as any)
      .select(`
        *,
        employer_employee:employer_employee_id (
          id,
          employer_id,
          company_id
        )
      `)
      .eq('id', id)
      .single();

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Verify access
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      const employee = existingAssignment.employer_employee;
      if (employee.employer_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - Only employer or admin can delete assignments' },
          { status: 403 }
        );
      }

      // Company scoping
      if (employee.company_id !== userProfile?.active_company_id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Soft delete by setting status to terminated
    const { error: updateError } = await (supabaseAdmin.from('client_assignments') as any)
      .update({
        status: 'terminated',
        terminated_at: new Date().toISOString(),
        termination_reason: body.termination_reason || 'Deleted by user',
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error deleting assignment:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete assignment', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment terminated successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/hr/assignments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

