import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch user's companies
export async function GET() {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let allCompanies: any[] = [];

    // First try: Get companies via company_members
    const { data: membershipCompanies, error: membershipError } = await supabase
      .from('company_members')
      .select(`
        company_id,
        role,
        is_primary,
        company:companies (
          id,
          name,
          logo_url,
          group_id
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('is_primary', { ascending: false });

    if (!membershipError && membershipCompanies) {
      allCompanies = membershipCompanies.map((cm: any) => ({
        company_id: cm.company?.id,
        company_name: cm.company?.name,
        company_logo: cm.company?.logo_url,
        user_role: cm.role,
        is_primary: cm.is_primary,
        group_name: null, // Will fetch group names separately if needed
      }));
    }

    // Second try: Also check if user owns any companies directly (in case company_members is missing)
    const { data: ownedCompanies, error: ownedError } = await supabase
      .from('companies')
      .select('id, name, logo_url, group_id')
      .eq('owner_id', user.id)
      .eq('is_active', true);

    if (!ownedError && ownedCompanies) {
      // Add owned companies that aren't already in the list
      const existingIds = new Set(allCompanies.map(c => c.company_id));
      for (const company of ownedCompanies) {
        if (!existingIds.has(company.id)) {
          allCompanies.push({
            company_id: company.id,
            company_name: company.name,
            company_logo: company.logo_url,
            user_role: 'owner',
            is_primary: allCompanies.length === 0,
            group_name: null,
          });
        }
      }
    }

    // Get active company from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    // Determine active_company_id
    let activeCompanyId = profile?.active_company_id;
    
    // If no active company set but user has companies, set the first one
    if (!activeCompanyId && allCompanies.length > 0) {
      activeCompanyId = allCompanies[0].company_id;
      
      // Update profile with active company
      await supabase
        .from('profiles')
        .update({ active_company_id: activeCompanyId })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      companies: allCompanies,
      active_company_id: activeCompanyId,
    });
  } catch (error: any) {
    console.error('Error in companies endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new company
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, logo_url, business_type, group_id } = body;

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Create the company
    const { data: company, error: createError } = await supabase
      .from('companies')
      .insert({
        name,
        slug,
        description,
        logo_url,
        business_type,
        group_id,
        owner_id: user.id,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating company:', createError);
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }

    // The trigger will auto-create company_members entry
    // But let's ensure it happened
    const { data: membership } = await supabase
      .from('company_members')
      .select('id')
      .eq('company_id', company.id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      // Create membership manually if trigger didn't fire
      await supabase
        .from('company_members')
        .insert({
          company_id: company.id,
          user_id: user.id,
          role: 'owner',
          is_primary: true,
          status: 'active',
        });
    }

    return NextResponse.json({
      success: true,
      company,
      message: 'Company created successfully',
    });
  } catch (error: any) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

