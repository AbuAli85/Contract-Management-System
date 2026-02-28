import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/companies/list
 * Returns the same employer parties as Manage Parties (GET /api/parties?type=Employer).
 * Used by the company switcher so the dropdown shows all employers, not just memberships/roles.
 * Two queries only: parties + profile. No per-row work, no timeout.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Please sign in' },
        { status: 401 }
      );
    }

    const [partiesRes, profileRes] = await Promise.all([
      supabase
        .from('parties')
        .select('id, name_en, name_ar, logo_url')
        .eq('type', 'Employer')
        .order('name_en', { ascending: true })
        .limit(500),
      supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single(),
    ]);

    if (partiesRes.error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load companies',
          message: partiesRes.error.message,
        },
        { status: 500 }
      );
    }

    const parties = partiesRes.data || [];
    const activeCompanyId = profileRes.data?.active_company_id ?? null;

    const companies = parties.map((p: any) => ({
      company_id: p.id,
      company_name: p.name_en || p.name_ar || 'Company',
      company_logo: p.logo_url ?? null,
      user_role: 'member',
      is_primary: p.id === activeCompanyId,
      group_name: null,
    }));

    return NextResponse.json({
      success: true,
      companies,
      active_company_id: activeCompanyId,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load companies',
        message: e?.message || 'Server error',
      },
      { status: 500 }
    );
  }
}
