import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get single document
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

    // Get document with employee info
    const { data: document, error } = await (
      supabaseAdmin.from('employee_documents') as any
    )
      .select(
        `
        *,
        employer_employee:employer_employee_id (
          id,
          employee_id,
          employer_id,
          company_id,
          employee:employee_id (
            id,
            name_en,
            name_ar,
            email
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
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
      const employee = document.employer_employee;
      if (
        employee.employer_id !== user.id &&
        employee.employee_id !== user.id
      ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Company scoping
      if (employee.company_id !== userProfile?.active_company_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('Error in GET /api/hr/documents/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update document
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

    // Get existing document
    const { data: existingDoc } = await (
      supabaseAdmin.from('employee_documents') as any
    )
      .select(
        `
        *,
        employer_employee:employer_employee_id (
          id,
          employer_id,
          company_id,
          employee_id
        )
      `
      )
      .eq('id', id)
      .single();

    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
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
      const employee = existingDoc.employer_employee;
      if (employee.employer_id !== user.id) {
        return NextResponse.json(
          {
            error: 'Unauthorized - Only employer or admin can update documents',
          },
          { status: 403 }
        );
      }

      // Company scoping
      if (employee.company_id !== userProfile?.active_company_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Allow updating these fields
    if (body.document_name !== undefined)
      updateData.document_name = body.document_name;
    if (body.file_url !== undefined) updateData.file_url = body.file_url;
    if (body.expiry_date !== undefined)
      updateData.expiry_date = body.expiry_date;
    if (body.issue_date !== undefined) updateData.issue_date = body.issue_date;
    if (body.issuing_authority !== undefined)
      updateData.issuing_authority = body.issuing_authority;
    if (body.document_number !== undefined)
      updateData.document_number = body.document_number;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Status updates (only employer/admin)
    if (
      body.status !== undefined &&
      (userProfile?.role === 'admin' ||
        existingDoc.employer_employee.employer_id === user.id)
    ) {
      updateData.status = body.status;
      if (body.status === 'verified') {
        updateData.verified_by = user.id;
        updateData.verified_at = new Date().toISOString();
      }
      if (body.status === 'rejected' && body.rejection_reason) {
        updateData.rejection_reason = body.rejection_reason;
      }
    }

    // Update document
    const { data: updatedDoc, error: updateError } = await (
      supabaseAdmin.from('employee_documents') as any
    )
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json(
        { error: 'Failed to update document', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document updated successfully',
      document: updatedDoc,
    });
  } catch (error) {
    console.error('Error in PUT /api/hr/documents/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete document
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

    // Get existing document
    const { data: existingDoc } = await (
      supabaseAdmin.from('employee_documents') as any
    )
      .select(
        `
        *,
        employer_employee:employer_employee_id (
          id,
          employer_id,
          company_id
        )
      `
      )
      .eq('id', id)
      .single();

    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
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
      const employee = existingDoc.employer_employee;
      if (employee.employer_id !== user.id) {
        return NextResponse.json(
          {
            error: 'Unauthorized - Only employer or admin can delete documents',
          },
          { status: 403 }
        );
      }

      // Company scoping
      if (employee.company_id !== userProfile?.active_company_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Delete document
    const { error: deleteError } = await (
      supabaseAdmin.from('employee_documents') as any
    )
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/hr/documents/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
