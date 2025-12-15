import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch company settings
export async function GET() {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's active company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json({ error: 'No active company selected' }, { status: 400 });
    }

    // Verify user has access and get role
    const { data: membership } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', profile.active_company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get company details
    const { data: company, error } = await supabase
      .from('companies')
      .select(`
        *,
        group:company_groups (
          id,
          name,
          name_ar
        )
      `)
      .eq('id', profile.active_company_id)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      company,
      user_role: membership.role,
      can_edit: ['owner', 'admin'].includes(membership.role),
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update company settings
export async function PUT(request: Request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get user's active company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json({ error: 'No active company selected' }, { status: 400 });
    }

    // Verify user has admin access
    const { data: membership } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', profile.active_company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Update company
    const allowedFields = [
      'name', 'description', 'logo_url', 'website', 'email', 'phone',
      'address', 'business_type', 'registration_number', 'vat_number',
      'settings', 'industry', 'size', 'location', 'brand_colors'
    ];

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: company, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', profile.active_company_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating company:', error);
      return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      company,
      message: 'Company settings updated successfully',
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

