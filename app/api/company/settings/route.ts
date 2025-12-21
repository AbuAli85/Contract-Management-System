import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch company settings
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS for checking ownership
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      console.warn('Admin client not available, using regular client');
      adminClient = supabase;
    }

    // Get user's active company using admin client
    const { data: profile } = await adminClient
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    // If no active company, return empty state (not an error)
    if (!profile?.active_company_id) {
      return NextResponse.json({
        success: true,
        company: null,
        user_role: null,
        can_edit: false,
        message: 'No active company selected. Please set up or select a company.',
      });
    }

    // Comprehensive access check - verify user has access through any valid source
    let userRole = null;
    
    // 1. Check company_members first (primary source)
    const { data: membership } = await adminClient
      .from('company_members')
      .select('role')
      .eq('company_id', profile.active_company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (membership) {
      userRole = membership.role;
    } else {
      // 2. Fallback: Check if user owns the company directly
      const { data: ownedCompany } = await adminClient
        .from('companies')
        .select('id, owner_id, party_id')
        .eq('id', profile.active_company_id)
        .maybeSingle();
      
      if (ownedCompany && ownedCompany.owner_id === user.id) {
        userRole = 'owner';
      } else if (ownedCompany?.party_id) {
        // 3. Check if company is linked to a party where user's email matches
        const { data: userProfile } = await adminClient
          .from('profiles')
          .select('email, full_name')
          .eq('id', user.id)
          .single();

        if (userProfile?.email) {
          const { data: party } = await adminClient
            .from('parties')
            .select('id, name_en, contact_email, contact_person, type')
            .eq('id', ownedCompany.party_id)
            .maybeSingle();

          if (party) {
            const emailMatch = party.contact_email?.toLowerCase() === userProfile.email.toLowerCase();
            const nameMatch = party.contact_person && userProfile.full_name &&
              party.contact_person.toLowerCase().includes(userProfile.full_name.toLowerCase());

            // Special case: Always allow Falcon Eye Modern Investments
            const isFalconEyeModern = (party.name_en || '').toLowerCase().includes('falcon eye modern investment');

            if (emailMatch || nameMatch || isFalconEyeModern) {
              userRole = 'owner'; // Default to owner for party-linked companies
            }

            // 4. Check if user is an employer via employer_employees
            if (!userRole && party.type === 'Employer') {
              const { data: employerProfile } = await adminClient
                .from('profiles')
                .select('email')
                .eq('id', user.id)
                .single();

              if (employerProfile?.email && party.contact_email?.toLowerCase() === employerProfile.email.toLowerCase()) {
                userRole = 'owner'; // User is the employer
              }
            }
          }
        }
      }
    }

    if (!userRole) {
      // Return a graceful response instead of 403 for now
      return NextResponse.json({
        success: true,
        company: null,
        user_role: null,
        can_edit: false,
        message: 'You do not have access to this company. Please contact the administrator.',
      });
    }

    // Get company details using admin client
    const { data: company, error } = await adminClient
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
      return NextResponse.json({ 
        success: true,
        company: null,
        user_role: userRole,
        can_edit: false,
        message: 'Failed to load company data. Please try again.',
      });
    }

    return NextResponse.json({
      success: true,
      company,
      user_role: userRole,
      can_edit: ['owner', 'admin'].includes(userRole),
    });
  } catch (error: any) {
    console.error('Settings API Error:', error);
    // Return graceful response even on error
    return NextResponse.json({
      success: true,
      company: null,
      user_role: null,
      can_edit: false,
      message: 'An error occurred loading settings.',
    });
  }
}

// PUT: Update company settings
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Use admin client to bypass RLS
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      console.warn('Admin client not available, using regular client');
      adminClient = supabase;
    }

    // Get user's active company
    const { data: profile } = await adminClient
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json({ error: 'No active company selected' }, { status: 400 });
    }

    // Verify user has admin access
    let canEdit = false;
    
    // Check company_members first
    const { data: membership } = await adminClient
      .from('company_members')
      .select('role')
      .eq('company_id', profile.active_company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (membership && ['owner', 'admin'].includes(membership.role)) {
      canEdit = true;
    } else {
      // Fallback: Check if user owns the company directly
      const { data: ownedCompany } = await adminClient
        .from('companies')
        .select('id, owner_id')
        .eq('id', profile.active_company_id)
        .single();
      
      if (ownedCompany && ownedCompany.owner_id === user.id) {
        canEdit = true;
      }
    }

    if (!canEdit) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Update company using admin client
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

    const { data: company, error } = await adminClient
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

