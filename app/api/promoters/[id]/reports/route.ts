import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // promoter_id
    const supabase = await createClient();

    // ✅ COMPANY SCOPE: Get user and verify access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ COMPANY SCOPE: Get active company and verify promoter belongs to company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (profile?.active_company_id) {
      // Get company's party_id
      const { data: company } = await supabase
        .from('companies')
        .select('party_id')
        .eq('id', profile.active_company_id)
        .single();

      if (company?.party_id) {
        // Verify promoter belongs to this company's party
        const { data: promoter } = await supabase
          .from('promoters')
          .select('employer_id')
          .eq('id', id)
          .single();

        if (promoter && promoter.employer_id !== company.party_id) {
          return NextResponse.json(
            { error: 'Promoter does not belong to your active company' },
            { status: 403 }
          );
        }
      }
    }

    const { data, error } = await supabase
      .from('promoter_reports')
      .select('*')
      .eq('promoter_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ reports: [] }, { status: 200 });
    }

    return NextResponse.json({ reports: data || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ reports: [] }, { status: 200 });
  }
}
