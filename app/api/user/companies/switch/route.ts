import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let body: { company_id?: string };
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { company_id } = body;
    if (!company_id || typeof company_id !== 'string') {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }
    const { data: membership, error: membershipError } = await supabase
      .from('company_members')
      .select('role, company:companies(id, name, logo_url)')
      .eq('company_id', company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (membershipError) {
      return NextResponse.json({ error: 'Failed to verify membership' }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({ error: 'You do not have access to this company' }, { status: 403 });
    }
    const companyData = Array.isArray(membership.company) ? membership.company[0] : membership.company;
    const companyName = companyData?.name ?? 'Company';
    const companyLogo = companyData?.logo_url ?? null;
    const userRole = membership.role ?? 'member';
    const { data: profile } = await supabase
      .from('profiles').select('id').eq('user_id', user.id).maybeSingle();
    let profileId = profile?.id;
    if (!profileId) {
      const { data: p2 } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (!p2) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      profileId = p2.id;
    }
    const { error: updateError } = await supabase
      .from('profiles').update({ active_company_id: company_id }).eq('id', profileId);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to switch company', details: updateError.message }, { status: 500 });
    }
    return NextResponse.json({
      success: true, company_id, company_name: companyName,
      company_logo: companyLogo, user_role: userRole,
      message: `Switched to ${companyName}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
