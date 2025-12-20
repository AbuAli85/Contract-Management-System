import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST: Switch active company
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company_id } = body;

    if (!company_id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      console.warn('Admin client not available, using regular client');
      adminClient = supabase;
    }

    // Verify user has access to this company
    const { data: membership } = await adminClient
      .from('company_members')
      .select('role, company:companies(name)')
      .eq('company_id', company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // Also check if user owns the company
    const { data: ownedCompany } = await adminClient
      .from('companies')
      .select('id, name, owner_id')
      .eq('id', company_id)
      .single();

    if (!membership && ownedCompany?.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this company' },
        { status: 403 }
      );
    }

    // Get company name for validation and response
    const companyNameOriginal = membership?.company?.name || ownedCompany?.name || '';
    
    // Helper function to check if company is invalid
    const isInvalid = (name: string): boolean => {
      const lower = name.toLowerCase().trim();
      if (lower.includes('falcon eye modern investments')) return false; // Allow valid Falcon Eye companies
      return (
        lower === 'digital morph' ||
        lower === 'falcon eye group' ||
        lower === 'cc' ||
        lower === 'digital marketing pro' ||
        lower.includes('digital morph') ||
        (lower.includes('falcon eye group') && !lower.includes('modern investments'))
      );
    };
    
    if (isInvalid(companyNameOriginal)) {
      return NextResponse.json(
        { error: 'Cannot switch to this company. It is not a valid company entity.' },
        { status: 400 }
      );
    }

    // Update user's active company
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ active_company_id: company_id })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating active company:', updateError);
      return NextResponse.json(
        { error: 'Failed to switch company' },
        { status: 500 }
      );
    }

    const companyName = companyNameOriginal || 'Company';

    return NextResponse.json({
      success: true,
      company_id,
      company_name: companyName,
      message: `Switched to ${companyName}`,
    });
  } catch (error: any) {
    console.error('Error in switch company:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
