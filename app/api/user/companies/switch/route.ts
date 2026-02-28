import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/companies/switch
 * Sets the user's active_company_id in profiles so all company-scoped data (promoters, contracts, etc.) follow.
 * Accepts company_id from: company_members (membership), or companies.owner_id (owned company).
 * Profile is identified by profiles.id = auth.uid() (consolidated profile schema).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let body: { company_id?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    const { company_id } = body;
    if (!company_id || typeof company_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'company_id is required' },
        { status: 400 }
      );
    }

    let adminClient: ReturnType<typeof createClient>;
    try {
      adminClient = createAdminClient();
    } catch {
      adminClient = supabase;
    }

    // 1) Resolve profile: consolidated schema uses profiles.id = auth.uid()
    const profileId = user.id;
    const { data: profileExists } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .maybeSingle();
    if (!profileExists) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // 2) Verify user has access to this company and get display info
    let companyName = 'Company';
    let companyLogo: string | null = null;
    let userRole = 'member';

    // 2a) Try company_members (standard membership)
    const { data: membership, error: membershipError } = await adminClient
      .from('company_members')
      .select('role, company:companies(id, name, logo_url)')
      .eq('company_id', company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membershipError && membership) {
      const companyData = Array.isArray(membership.company)
        ? membership.company[0]
        : membership.company;
      companyName = (companyData as any)?.name ?? companyName;
      companyLogo = (companyData as any)?.logo_url ?? null;
      userRole = membership.role ?? 'member';
    } else {
      // 2b) User is owner of this company
      const { data: ownedCompany, error: ownedError } = await adminClient
        .from('companies')
        .select('id, name, logo_url')
        .eq('id', company_id)
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!ownedError && ownedCompany) {
        companyName = ownedCompany.name ?? companyName;
        companyLogo = ownedCompany.logo_url ?? null;
        userRole = 'owner';
      } else {
        // 2c) User has access via user_roles (all companies under their profile)
        const { data: roleRow } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('company_id', company_id)
          .maybeSingle();
        const { data: companyRow } = await adminClient
          .from('companies')
          .select('id, name, logo_url')
          .eq('id', company_id)
          .maybeSingle();

        if (roleRow && companyRow) {
          companyName = companyRow.name ?? companyName;
          companyLogo = companyRow.logo_url ?? null;
          userRole = (roleRow as any).role ?? 'member';
        } else {
          return NextResponse.json(
            {
              success: false,
              error: 'You do not have access to this company',
              code: 'NO_ACCESS',
            },
            { status: 403 }
          );
        }
      }
    }

    // 3) Update profile.active_company_id (use admin client so RLS cannot block)
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ active_company_id: company_id })
      .eq('id', profileId);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to switch company',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      company_id,
      company_name: companyName,
      company_logo: companyLogo,
      user_role: userRole,
      message: `Switched to ${companyName}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
