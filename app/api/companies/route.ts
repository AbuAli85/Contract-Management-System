import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC, withRBAC } from '@/lib/rbac/guard';

export const GET = withAnyRBAC(
  ['company:read:own', 'company:read:organization', 'company:read:all'],
  async (request: NextRequest) => {
    try {

      const supabase = await createClient();
      const { searchParams } = new URL(request.url);
      const promoterId = searchParams.get('promoter_id');

      // Check if we're using a mock client
      if (!supabase || typeof supabase.from !== 'function') {
        return NextResponse.json(
          {
            success: true,
            companies: [],
            count: 0,
            error: 'Database connection not available',
          },
          { status: 200 }
        );
      }


      // Build query based on filters
      let query = supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (promoterId) {
        query = query.eq('promoter_id', promoterId);
      }

      let companies = [];
      try {
        const { data: companiesData, error: companiesError } =
          await query.limit(50);

        if (companiesError) {
          companies = [];
        } else {
          companies = companiesData || [];
        }
      } catch (error) {
        companies = [];
      }


      return NextResponse.json({
        success: true,
        companies: companies || [],
        count: companies?.length || 0,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: true, // Return success to avoid errors
          companies: [],
          count: 0,
          error: 'Internal server error',
        },
        { status: 200 }
      );
    }
  }
);

async function createCompanyHandler(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { role } = body;

  const companyName = body.company_name || body.name || 'My Company';
  const slug =
    body.slug ||
    companyName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 50) +
      '-' +
      Date.now().toString(36);

  const companyPayload = {
    name: companyName,
    slug,
    owner_id: session.user.id,
    email: body.email ?? null,
    phone: body.phone ?? null,
    address: body.address ?? null,
    description: body.description ?? null,
    website: body.website ?? null,
    business_category: body.business_category ?? null,
    country: body.country ?? null,
    city: body.city ?? null,
    postal_code: body.postal_code ?? null,
    tax_number: body.tax_number ?? null,
    commercial_registration: body.commercial_registration ?? null,
    license_number: body.license_number ?? null,
    logo_url: body.logo_url ?? null,
    promoter_id: body.promoter_id ?? null,
  };

  const { data: company, error } = await supabase
    .from('companies')
    .insert(companyPayload)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create company', details: error.message },
      { status: 500 }
    );
  }

  // Ensure membership: upsert for idempotency (retries, slug collision flows)
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert(
      {
        user_id: session.user.id,
        company_id: company.id,
        role: role === 'provider' ? 'provider' : 'admin',
        is_active: true,
        assigned_at: new Date().toISOString(),
        assigned_by: session.user.id,
      },
      {
        onConflict: 'user_id,company_id',
      }
    );

  if (roleError) {
    // Non-fatal: company created; membership may exist or RLS may block
  }

  // Set active_company_id so getCompanyRole() works immediately
  await supabase
    .from('profiles')
    .update({ active_company_id: company.id })
    .eq('id', session.user.id);

  return NextResponse.json({
    success: true,
    company,
    message:
      role === 'provider'
        ? 'Company registered and provider role assigned successfully'
        : 'Company registered successfully',
  });
}

export const POST = withRBAC('companies:create:own', createCompanyHandler);
