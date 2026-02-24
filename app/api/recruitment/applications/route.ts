import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// GET /api/recruitment/applications - List candidate applications
export const GET = withAnyRBAC(
  ['company:read:all', 'admin:all'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const jobPostingId = searchParams.get('job_posting_id');
      const status = searchParams.get('status');
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      // Get user's company context
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('candidate_applications')
        .select(
          `
          *,
          job_posting:job_postings(id, title, title_ar, department),
          candidate:profiles(id, email, full_name, phone)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (profile?.active_company_id) {
        query = query.eq('company_id', profile.active_company_id);
      }

      if (jobPostingId) {
        query = query.eq('job_posting_id', jobPostingId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: applications, error, count } = await query;

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch applications', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        applications: applications || [],
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

// POST /api/recruitment/applications - Create application
export const POST = withAnyRBAC(
  ['company:manage:all', 'admin:all', 'public:apply'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const body = await request.json();
      const {
        job_posting_id,
        candidate_id,
        candidate_name_en,
        candidate_name_ar,
        candidate_email,
        candidate_phone,
        candidate_nationality,
        cover_letter,
        expected_salary,
        available_start_date,
        notice_period_days,
        resume_url,
        cover_letter_url,
        source,
      } = body;

      if (!job_posting_id || !candidate_email) {
        return NextResponse.json(
          { error: 'Missing required fields: job_posting_id, candidate_email' },
          { status: 400 }
        );
      }

      // Get job posting to get company_id
      const { data: jobPosting } = await supabase
        .from('job_postings')
        .select('company_id, status')
        .eq('id', job_posting_id)
        .single();

      if (!jobPosting || jobPosting.status !== 'published') {
        return NextResponse.json(
          { error: 'Job posting not found or not published' },
          { status: 404 }
        );
      }

      // Create application
      const { data: application, error } = await supabase
        .from('candidate_applications')
        .insert({
          job_posting_id,
          candidate_id: candidate_id || null,
          company_id: jobPosting.company_id,
          candidate_name_en: candidate_name_en || null,
          candidate_name_ar: candidate_name_ar || null,
          candidate_email,
          candidate_phone: candidate_phone || null,
          candidate_nationality: candidate_nationality || null,
          cover_letter: cover_letter || null,
          expected_salary: expected_salary ? parseFloat(expected_salary) : null,
          available_start_date: available_start_date || null,
          notice_period_days: notice_period_days || null,
          resume_url: resume_url || null,
          cover_letter_url: cover_letter_url || null,
          source: source || 'website',
          status: 'applied',
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create application', details: error.message },
          { status: 500 }
        );
      }

      // Update job posting applications count
      await supabase
        .rpc('increment', {
          table_name: 'job_postings',
          column_name: 'applications_count',
          row_id: job_posting_id,
          increment_value: 1,
        })
        .catch(() => {
          // RPC might not exist, that's okay
        });

      return NextResponse.json(
        {
          success: true,
          application,
          message: 'Application submitted successfully',
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
