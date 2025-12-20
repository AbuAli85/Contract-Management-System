import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// GET /api/work-permits/[id] - Get specific work permit application
export const GET = withAnyRBAC(
  ['company:read:all', 'party:read:all', 'work_permit:read:all'],
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const supabase = await createClient();
      const { id } = await params;

      const { data: application, error } = await supabase
        .from('work_permit_applications')
        .select(`
          *,
          employer:profiles!work_permit_applications_employer_id_fkey(id, email, full_name),
          employee:profiles!work_permit_applications_employee_id_fkey(id, email, full_name),
          employer_party:parties(id, name_en, name_ar, crn),
          promoter:promoters(id, name_en, name_ar, email, passport_number, id_card_number)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Work permit application not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to fetch work permit application', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        application,
      });
    } catch (error: any) {
      console.error('Error in GET /api/work-permits/[id]:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// PUT /api/work-permits/[id] - Update work permit application
export const PUT = withAnyRBAC(
  ['company:manage:all', 'party:manage:all', 'work_permit:update:all'],
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { id } = await params;
      const body = await request.json();

      // Get existing application to check status
      const { data: existing } = await supabase
        .from('work_permit_applications')
        .select('status')
        .eq('id', id)
        .single();

      if (!existing) {
        return NextResponse.json(
          { error: 'Work permit application not found' },
          { status: 404 }
        );
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Allow updating specific fields
      if (body.status !== undefined) {
        updateData.status = body.status;
        if (body.status === 'submitted') {
          updateData.submitted_by = user.id;
          updateData.submitted_at = new Date().toISOString();
        }
        if (body.status === 'approved') {
          updateData.approved_by = user.id;
          updateData.approved_at = new Date().toISOString();
          if (body.work_permit_number) {
            updateData.work_permit_number = body.work_permit_number;
          }
        }
      }

      // Update other fields
      const allowedFields = [
        'employee_name_en', 'employee_name_ar', 'national_id', 'passport_number',
        'nationality', 'job_title', 'department', 'employment_type',
        'work_permit_start_date', 'work_permit_end_date', 'work_permit_category',
        'salary', 'currency', 'required_documents', 'submitted_documents',
        'document_urls', 'internal_notes', 'ministry_reference_number',
        'ministry_submission_date', 'ministry_approval_date', 'ministry_notes',
        'rejection_reason', 'work_permit_number'
      ];

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      });

      const { data: application, error } = await supabase
        .from('work_permit_applications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating work permit application:', error);
        return NextResponse.json(
          { error: 'Failed to update work permit application', details: error.message },
          { status: 500 }
        );
      }

      // Update compliance record if work permit was approved
      if (body.status === 'approved' && application.work_permit_end_date) {
        await supabase
          .from('work_permit_compliance')
          .upsert({
            employer_id: application.employer_id,
            employer_party_id: application.employer_party_id,
            employee_id: application.employee_id,
            work_permit_application_id: application.id,
            work_permit_number: application.work_permit_number,
            work_permit_expiry_date: application.work_permit_end_date,
            compliance_status: 'compliant',
          }, {
            onConflict: 'employer_id,employee_id',
          });
      }

      return NextResponse.json({
        success: true,
        application,
        message: 'Work permit application updated successfully',
      });
    } catch (error: any) {
      console.error('Error in PUT /api/work-permits/[id]:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/work-permits/[id] - Delete work permit application (only if draft)
export const DELETE = withAnyRBAC(
  ['company:manage:all', 'party:manage:all', 'work_permit:delete:all'],
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const supabase = await createClient();
      const { id } = await params;

      // Check if application can be deleted (only draft status)
      const { data: existing } = await supabase
        .from('work_permit_applications')
        .select('status')
        .eq('id', id)
        .single();

      if (!existing) {
        return NextResponse.json(
          { error: 'Work permit application not found' },
          { status: 404 }
        );
      }

      if (existing.status !== 'draft') {
        return NextResponse.json(
          { error: 'Only draft applications can be deleted' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('work_permit_applications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting work permit application:', error);
        return NextResponse.json(
          { error: 'Failed to delete work permit application', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Work permit application deleted successfully',
      });
    } catch (error: any) {
      console.error('Error in DELETE /api/work-permits/[id]:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

