import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/companies/current
 * Returns the current active company display info (for showing "Showing for: [Name]" when full list fails).
 * Resolves profile.active_company_id from companies table or parties (Employer) for party-as-company.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json({
        company_id: null,
        company_name: null,
        company_logo: null,
        party_id: null,
      });
    }

    const activeId = profile.active_company_id;

    const { data: partyRow } = await supabase
      .from('parties')
      .select('id, name_en, name_ar, logo_url, type')
      .eq('id', activeId)
      .maybeSingle();

    if (partyRow?.type === 'Employer') {
      return NextResponse.json({
        company_id: activeId,
        company_name: partyRow.name_en || partyRow.name_ar || 'Company',
        company_logo: partyRow.logo_url ?? null,
        party_id: activeId,
      });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id, name, logo_url, party_id')
      .eq('id', activeId)
      .maybeSingle();

    if (company) {
      return NextResponse.json({
        company_id: company.id,
        company_name: company.name ?? 'Company',
        company_logo: company.logo_url ?? null,
        party_id: company.party_id ?? null,
      });
    }

    return NextResponse.json({
      company_id: null,
      company_name: null,
      company_logo: null,
      party_id: null,
    });
  } catch {
    return NextResponse.json(
      { company_id: null, company_name: null, company_logo: null, party_id: null },
      { status: 500 }
    );
  }
}
