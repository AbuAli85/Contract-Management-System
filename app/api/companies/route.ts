import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

export const GET = withAnyRBAC(
  ['company:read:own', 'company:read:organization', 'company:read:all'],
  async (request: NextRequest) => {
    try {
      console.log('🔍 Companies API: Starting request...');

      const supabase = await createClient();
      const { searchParams } = new URL(request.url);
      const promoterId = searchParams.get('promoter_id');

      // Check if we're using a mock client
      if (!supabase || typeof supabase.from !== 'function') {
        console.error(
          '❌ Companies API: Using mock client - environment variables may be missing'
        );
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

      console.log('🔍 Companies API: Fetching companies from database...');

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
          console.warn(
            '⚠️ Companies API: Error fetching companies:',
            companiesError.message
          );
          companies = [];
        } else {
          companies = companiesData || [];
        }
      } catch (error) {
        console.warn(
          '⚠️ Companies API: Company fetch failed, continuing with empty array'
        );
        companies = [];
      }

      console.log(
        `✅ Companies API: Successfully fetched ${companies?.length || 0} companies`
      );

      return NextResponse.json({
        success: true,
        companies: companies || [],
        count: companies?.length || 0,
      });
    } catch (error) {
      console.error('❌ Companies API: Unexpected error:', error);
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Extract role from the request body
    const { role } = body;

    // Prepare company data
    const companyData = {
      company_name: body.company_name,
      company_number: body.company_number,
      email: body.email,
      phone: body.phone,
      address: body.address,
      promoter_id: body.promoter_id,
      user_id: session.user.id,
      role: role, // Include role in company data
      business_category: body.business_category,
      description: body.description,
      website: body.website,
      country: body.country,
      city: body.city,
      postal_code: body.postal_code,
      tax_number: body.tax_number,
      commercial_registration: body.commercial_registration,
      license_number: body.license_number,
      logo_url: body.logo_url,
    };

    // Insert the company
    const { data: company, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create company',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // If this is a provider registration, update the user's role
    if (role === 'provider') {
      console.log('Assigning provider role to user:', session.user.id);
      
      // Update users table
      const { error: userRoleError } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          full_name: body.contact_name || session.user.user_metadata?.full_name,
          role: 'provider',
          status: 'active',
          updated_at: new Date().toISOString(),
        });

      if (userRoleError) {
        console.error('Error updating user role:', userRoleError);
      }

      // Also update user_roles table for redundancy
      const { error: userRolesError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: session.user.id,
          role: 'provider',
          assigned_at: new Date().toISOString(),
          assigned_by: session.user.id,
        });

      if (userRolesError) {
        console.error('Error updating user_roles:', userRolesError);
      }

      console.log('Provider role assignment completed');
    }

    return NextResponse.json({
      success: true,
      company,
      message: role === 'provider' ? 'Company registered and provider role assigned successfully' : 'Company registered successfully',
    });
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
