import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// GET /api/work-permits/compliance - Get compliance status for all work permits
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
      const alertLevel = searchParams.get('alert_level');
      const employerId = searchParams.get('employer_id');

      // Build query
      let query = supabase
        .from('work_permit_compliance')
        .select(
          `
          *,
          employer:profiles!work_permit_compliance_employer_id_fkey(id, email, full_name),
          employee:profiles!work_permit_compliance_employee_id_fkey(id, email, full_name),
          employer_party:parties(id, name_en, name_ar),
          application:work_permit_applications(id, application_number, status)
        `,
          { count: 'exact' }
        )
        .order('work_permit_expiry_date', { ascending: true });

      // Apply filters
      if (status) {
        query = query.eq('compliance_status', status);
      }

      if (alertLevel) {
        query = query.eq('alert_level', alertLevel);
      }

      if (employerId) {
        query = query.eq('employer_id', employerId);
      } else if (profile?.active_company_id) {
        // Filter by company
        const { data: companyMembers } = await supabase
          .from('company_members')
          .select('user_id')
          .eq('company_id', profile.active_company_id)
          .eq('status', 'active');

        if (companyMembers && companyMembers.length > 0) {
          const employerIds = companyMembers.map(m => m.user_id);
          query = query.in('employer_id', employerIds);
        } else {
          return NextResponse.json({
            success: true,
            compliance: [],
            count: 0,
            summary: {
              compliant: 0,
              expiring_soon: 0,
              expired: 0,
              non_compliant: 0,
              pending_renewal: 0,
            },
          });
        }
      }

      const { data: compliance, error, count } = await query;

      if (error) {
        console.error('Error fetching work permit compliance:', error);
        return NextResponse.json(
          { error: 'Failed to fetch compliance data', details: error.message },
          { status: 500 }
        );
      }

      // Calculate summary
      const summary = {
        compliant:
          compliance?.filter((c: any) => c.compliance_status === 'compliant')
            .length || 0,
        expiring_soon:
          compliance?.filter(
            (c: any) => c.compliance_status === 'expiring_soon'
          ).length || 0,
        expired:
          compliance?.filter((c: any) => c.compliance_status === 'expired')
            .length || 0,
        non_compliant:
          compliance?.filter(
            (c: any) => c.compliance_status === 'non_compliant'
          ).length || 0,
        pending_renewal:
          compliance?.filter(
            (c: any) => c.compliance_status === 'pending_renewal'
          ).length || 0,
      };

      return NextResponse.json({
        success: true,
        compliance: compliance || [],
        count: count || 0,
        summary,
      });
    } catch (error: any) {
      console.error('Error in GET /api/work-permits/compliance:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
