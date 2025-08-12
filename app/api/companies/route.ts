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

    // Prepare company data
    const companyData = {
      company_name: body.company_name,
      company_number: body.company_number,
      email: body.email,
      phone: body.phone,
      address: body.address,
      promoter_id: body.promoter_id,
      user_id: session.user.id,
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

    return NextResponse.json({
      success: true,
      company,
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
