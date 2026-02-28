import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/active-company-party
 * Returns the party_id for the current user's active company (for use in promoter employer_id pre-fill).
 * - If active_company_id is a party (Employer type), returns that party id.
 * - Otherwise resolves companies.party_id for the active company.
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
      return NextResponse.json({ party_id: null });
    }

    const activeId = profile.active_company_id;

    // Check if active_company_id is itself a party (Employer) — parties_employer_direct
    const { data: partyRow } = await supabase
      .from('parties')
      .select('id, type')
      .eq('id', activeId)
      .maybeSingle();

    if (partyRow?.type === 'Employer') {
      return NextResponse.json({ party_id: activeId });
    }

    // Resolve company's party_id
    const { data: company } = await supabase
      .from('companies')
      .select('party_id')
      .eq('id', activeId)
      .maybeSingle();

    return NextResponse.json({
      party_id: company?.party_id ?? null,
    });
  } catch {
    return NextResponse.json({ party_id: null }, { status: 500 });
  }
}
