import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// GET /api/work-permits/renewals - List work permit renewals
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

      const status = searchParams.get('status');
      const renewalType = searchParams.get('type');
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      // Build query
      let query = supabase
        .from('work_permit_renewals')
        .select(
          `
          *,
          application:work_permit_applications(
            id,
            application_number,
            employee_name_en,
            employee_name_ar,
            job_title,
            employer_id,
            employee_id
          )
        `,
          { count: 'exact' }
        )
        .order('current_expiry_date', { ascending: true })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (renewalType) {
        query = query.eq('renewal_type', renewalType);
      }

      const { data: renewals, error, count } = await query;

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch renewals', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        renewals: renewals || [],
        count: count || 0,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// POST /api/work-permits/renewals - Create new renewal
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
        work_permit_application_id,
        original_work_permit_number,
        renewal_type,
        current_expiry_date,
        renewal_start_date,
        renewal_end_date,
        renewal_documents,
        document_urls,
        notes,
      } = body;

      // Validation
      if (!original_work_permit_number || !current_expiry_date) {
        return NextResponse.json(
          {
            error:
              'Missing required fields: original_work_permit_number, current_expiry_date',
          },
          { status: 400 }
        );
      }

      // Create renewal
      const { data: renewal, error } = await supabase
        .from('work_permit_renewals')
        .insert({
          work_permit_application_id: work_permit_application_id || null,
          original_work_permit_number,
          renewal_type: renewal_type || 'standard',
          current_expiry_date,
          renewal_start_date: renewal_start_date || null,
          renewal_end_date: renewal_end_date || null,
          renewal_documents: renewal_documents || [],
          document_urls: document_urls || {},
          notes: notes || null,
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create renewal', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          renewal,
          message: 'Work permit renewal created successfully',
        },
        { status: 201 }
      );
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
