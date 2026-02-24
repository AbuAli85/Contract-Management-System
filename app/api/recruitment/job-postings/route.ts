import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// GET /api/recruitment/job-postings - List job postings
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
      const status = searchParams.get('status');
      const jobType = searchParams.get('job_type');
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      // Get user's company context
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('job_postings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (profile?.active_company_id) {
        query = query.eq('company_id', profile.active_company_id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (jobType) {
        query = query.eq('job_type', jobType);
      }

      const { data: jobPostings, error, count } = await query;

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch job postings', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        jobPostings: jobPostings || [],
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

// POST /api/recruitment/job-postings - Create job posting
export const POST = withAnyRBAC(
  ['company:manage:all', 'admin:all'],
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
        title,
        title_ar,
        description,
        description_ar,
        department,
        job_type,
        location,
        salary_min,
        salary_max,
        currency,
        experience_required,
        education_required,
        required_skills,
        preferred_skills,
        required_documents,
        application_deadline,
      } = body;

      if (!title || !job_type) {
        return NextResponse.json(
          { error: 'Missing required fields: title, job_type' },
          { status: 400 }
        );
      }

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      // Create job posting
      const { data: jobPosting, error } = await supabase
        .from('job_postings')
        .insert({
          company_id: profile?.active_company_id,
          title,
          title_ar: title_ar || null,
          description: description || null,
          description_ar: description_ar || null,
          department: department || null,
          job_type,
          location: location || null,
          salary_min: salary_min ? parseFloat(salary_min) : null,
          salary_max: salary_max ? parseFloat(salary_max) : null,
          currency: currency || 'OMR',
          experience_required: experience_required || null,
          education_required: education_required || null,
          required_skills: required_skills || [],
          preferred_skills: preferred_skills || [],
          required_documents: required_documents || [],
          application_deadline: application_deadline || null,
          status: 'draft',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create job posting', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          jobPosting,
          message: 'Job posting created successfully',
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
