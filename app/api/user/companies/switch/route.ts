import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST: Switch to a different company
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      console.warn('Admin client not available, using regular client');
      adminClient = supabase;
    }

    const body = await request.json();
    const { company_id } = body;

    if (!company_id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Verify user is a member of this company or owns it
    let userRole = null;
    let companyName = null;

    // Check company_members first using admin client
    const { data: membership } = await adminClient
      .from('company_members')
      .select('id, role, company:companies(name)')
      .eq('company_id', company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (membership) {
      userRole = membership.role;
      companyName = (membership.company as any)?.name;
    } else {
      // Fallback: Check if user owns the company directly
      const { data: ownedCompany } = await adminClient
        .from('companies')
        .select('id, name, owner_id')
        .eq('id', company_id)
        .single();
      
      if (ownedCompany && ownedCompany.owner_id === user.id) {
        userRole = 'owner';
        companyName = ownedCompany.name;
      }
    }

    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this company' }, { status: 403 });
    }

    // Update active company using admin client
    const { error: updateError } = await adminClient
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
      message: `Switched to ${companyName || 'company'}`,
      company_id,
      role: userRole,
    });
  } catch (error: any) {
    console.error('Error switching company:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

