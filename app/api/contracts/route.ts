import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

// ✅ SECURITY: RBAC enabled with rate limiting
export const GET = withRBAC('contract:read:own', async (request: Request) => {
  try {
    console.log('🔍 API /api/contracts GET called (RBAC ENABLED)');

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase credentials:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error',
          details: 'Missing Supabase environment variables',
          debug: {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!supabaseAnonKey,
            timestamp: new Date().toISOString()
          }
        },
        { status: 500 }
      );
    }

    // ✅ SECURITY: Using ANON key with RLS policies
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options as any)
            );
          } catch {}
        },
      } as any,
    });

    // ✅ SECURITY: Verify authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication failed:', {
        authError: authError?.message,
        hasUser: !!user,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          details: authError?.message || 'Please log in to access contracts data',
          debug: {
            hasUser: !!user,
            authError: authError?.message,
            timestamp: new Date().toISOString()
          }
        },
        { status: 401 }
      );
    }

    console.log('👤 Authenticated user:', user.email);

    // Parse pagination from query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '50'),
      100
    );
    const offset = (page - 1) * limit;

    console.log('📊 Query params:', { page, limit, offset });

    // ✅ SECURITY: Query with RLS policies - only returns authorized data
    const {
      data: contracts,
      error,
      count,
    } = await supabase
      .from('contracts')
      .select(
        `
        id, contract_number, status, contract_start_date, contract_end_date,
        job_title, work_location, contract_value, email, pdf_url,
        first_party_id, second_party_id, promoter_id, created_at, updated_at,
        first_party:parties!first_party_id (
          id, name_en, name_ar, type, status, email
        ),
        second_party:parties!second_party_id (
          id, name_en, name_ar, type, status, email
        ),
        promoters (
          id, name_en, name_ar, email, mobile_number
        )
      `,
        { count: 'exact' }
      )
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch contracts',
          details: error.message,
          debug: {
            code: error.code,
            details: error.details,
            hint: error.hint,
            timestamp: new Date().toISOString()
          }
        },
        { status: 500 }
      );
    }

    console.log(
      `✅ Fetched ${contracts?.length || 0} contracts (total: ${count})`
    );

    return NextResponse.json(
      {
        success: true,
        contracts: contracts || [],
        count: contracts?.length || 0,
        total: count || 0,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: offset + limit < (count || 0),
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
});

// ✅ SECURITY: RBAC enabled for contract creation
export const POST = withRBAC('contract:create:own', async (request: Request) => {
  try {
    console.log('🔍 API /api/contracts POST called (RBAC ENABLED)');

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options as any)
            );
          } catch {}
        },
      } as any,
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          details: 'Please log in to create contracts',
        },
        { status: 401 }
      );
    }

    console.log('👤 Authenticated user:', user.email);

    // Parse and validate request body
    const body = await request.json();
    
    // Basic validation
    if (!body.contract_number) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation error',
          details: 'Contract number is required' 
        },
        { status: 400 }
      );
    }

    // Check if contract number already exists
    const { data: existingContract, error: checkError } = await supabase
      .from('contracts')
      .select('id')
      .eq('contract_number', body.contract_number)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking contract number:', checkError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to validate contract number' 
        },
        { status: 500 }
      );
    }

    if (existingContract) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Contract number already exists' 
        },
        { status: 400 }
      );
    }

    // Prepare contract data
    const contractData = {
      ...body,
      created_by: user.id,
      updated_by: user.id,
    };

    console.log('📝 Creating contract');

    // Insert contract into database
    const { data: contract, error: insertError } = await supabase
      .from('contracts')
      .insert([contractData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Contract creation error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create contract',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Contract created successfully:', contract.id);

    return NextResponse.json(
      {
        success: true,
        contract,
        message: 'Contract created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
});
