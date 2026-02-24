import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// GET /api/work-permits - List work permit applications
export const GET = withAnyRBAC(
  ['company:read:all', 'party:read:all', 'work_permit:read:all'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get user's company context
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id, role')
        .eq('id', user.id)
        .single();

      const status = searchParams.get('status');
      const applicationType = searchParams.get('type');
      const employerId = searchParams.get('employer_id');
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      // Build query
      let query = supabase
        .from('work_permit_applications')
        .select(
          `
          *,
          employer:profiles!work_permit_applications_employer_id_fkey(id, email, full_name),
          employee:profiles!work_permit_applications_employee_id_fkey(id, email, full_name),
          employer_party:parties(id, name_en, name_ar),
          promoter:promoters(id, name_en, name_ar, email)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (applicationType) {
        query = query.eq('application_type', applicationType);
      }

      if (employerId) {
        query = query.eq('employer_id', employerId);
      } else if (profile?.active_company_id) {
        // Filter by company if user has active company
        // This would need company_id in work_permit_applications or via employer_party_id
        // For now, filter by employer_id matching user's company members
        const { data: companyMembers } = await supabase
          .from('company_members')
          .select('user_id')
          .eq('company_id', profile.active_company_id)
          .eq('status', 'active');

        if (companyMembers && companyMembers.length > 0) {
          const employerIds = companyMembers.map(m => m.user_id);
          query = query.in('employer_id', employerIds);
        } else {
          // No company members, return empty
          return NextResponse.json({
            success: true,
            applications: [],
            count: 0,
          });
        }
      }

      const { data: applications, error, count } = await query;

      if (error) {
        console.error('Error fetching work permits:', error);
        return NextResponse.json(
          { error: 'Failed to fetch work permits', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        applications: applications || [],
        count: count || 0,
      });
    } catch (error: any) {
      console.error('Error in GET /api/work-permits:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// POST /api/work-permits - Create new work permit application
export const POST = withAnyRBAC(
  ['company:manage:all', 'party:manage:all', 'work_permit:create:all'],
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
        employer_id,
        employer_party_id,
        employee_id,
        promoter_id,
        application_type,
        employee_name_en,
        employee_name_ar,
        national_id,
        passport_number,
        nationality,
        job_title,
        department,
        employment_type,
        work_permit_start_date,
        work_permit_end_date,
        work_permit_category,
        salary,
        currency,
        required_documents,
        submitted_documents,
        document_urls,
        internal_notes,
      } = body;

      // Validation
      if (
        !employer_id ||
        !employee_id ||
        !application_type ||
        !employee_name_en ||
        !job_title
      ) {
        return NextResponse.json(
          {
            error:
              'Missing required fields: employer_id, employee_id, application_type, employee_name_en, job_title',
          },
          { status: 400 }
        );
      }

      // Create application
      const { data: application, error } = await supabase
        .from('work_permit_applications')
        .insert({
          employer_id,
          employer_party_id: employer_party_id || null,
          employee_id,
          promoter_id: promoter_id || null,
          application_type,
          employee_name_en,
          employee_name_ar: employee_name_ar || null,
          national_id: national_id || null,
          passport_number: passport_number || null,
          nationality: nationality || null,
          job_title,
          department: department || null,
          employment_type: employment_type || null,
          work_permit_start_date: work_permit_start_date || null,
          work_permit_end_date: work_permit_end_date || null,
          work_permit_category: work_permit_category || null,
          salary: salary ? parseFloat(salary) : null,
          currency: currency || 'OMR',
          required_documents: required_documents || [],
          submitted_documents: submitted_documents || [],
          document_urls: document_urls || {},
          internal_notes: internal_notes || null,
          status: 'draft',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating work permit application:', error);
        return NextResponse.json(
          {
            error: 'Failed to create work permit application',
            details: error.message,
          },
          { status: 500 }
        );
      }

      // Create or update compliance record
      if (work_permit_end_date) {
        await supabase.from('work_permit_compliance').upsert(
          {
            employer_id,
            employer_party_id: employer_party_id || null,
            employee_id,
            work_permit_application_id: application.id,
            work_permit_number: null, // Will be updated when approved
            work_permit_expiry_date: work_permit_end_date,
            compliance_status: 'pending_renewal',
          },
          {
            onConflict: 'employer_id,employee_id',
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          application,
          message: 'Work permit application created successfully',
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Error in POST /api/work-permits:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
