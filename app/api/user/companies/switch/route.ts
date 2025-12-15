import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST: Switch to a different company
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company_id } = body;

    if (!company_id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Verify user is a member of this company
    const { data: membership, error: memberError } = await supabase
      .from('company_members')
      .select('id, role, company:companies(name)')
      .eq('company_id', company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'You are not a member of this company' }, { status: 403 });
    }

    // Update active company
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        active_company_id: company_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error switching company:', updateError);
      return NextResponse.json({ error: 'Failed to switch company' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Switched to ${(membership.company as any)?.name}`,
      company_id,
      role: membership.role,
    });
  } catch (error: any) {
    console.error('Error switching company:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

