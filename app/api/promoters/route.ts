import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC, withAnyRBAC } from '@/lib/rbac/guard';
import { ratelimitStrict, getClientIdentifier, getRateLimitHeaders, createRateLimitResponse } from '@/lib/rate-limit';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Validation schema for promoter data
const promoterSchema = z.object({
  name_en: z.string().min(1, 'English name is required'),
  name_ar: z.string().min(1, 'Arabic name is required'),
  id_card_number: z.string().min(1, 'ID card number is required'),
  id_card_url: z.string().optional(),
  passport_url: z.string().optional(),
  passport_number: z.string().optional(),
  mobile_number: z.string().optional(),
  profile_picture_url: z.string().optional(),
  status: z
    .enum([
      'active',
      'inactive',
      'suspended',
      'holiday',
      'on_leave',
      'terminated',
      'pending_approval',
      'retired',
      'probation',
      'resigned',
      'contractor',
      'temporary',
      'training',
      'other',
    ])
    .default('active'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  nationality: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
  employer_id: z.string().uuid().optional(),
  notify_days_before_id_expiry: z.number().min(1).max(365).default(100),
  notify_days_before_passport_expiry: z.number().min(1).max(365).default(210),
});

// ✅ SECURITY: RBAC enabled with rate limiting
export const GET = withRBAC('promoter:read:own', async (request: Request) => {
  try {
    // ✅ SECURITY: Apply rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await ratelimitStrict.limit(identifier);
    
    if (!rateLimitResult.success) {
      const headers = getRateLimitHeaders(rateLimitResult);
      const body = createRateLimitResponse(rateLimitResult);
      
      return NextResponse.json(body, {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
    }

    console.log('🔍 API /api/promoters GET called (RBAC ENABLED, Rate Limited)');
      
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase credentials');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
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
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {}
        },
      } as any,
    });

    // ✅ SECURITY: Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          details: 'Please log in to access promoters data'
        },
        { status: 401 }
      );
    }

    console.log('👤 Authenticated user:', user.email);

    // Parse pagination from query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    console.log('📊 Query params:', { page, limit, offset });

    // ✅ SECURITY: Query with RLS policies - only returns authorized data
    const { data: promoters, error, count } = await supabase
      .from('promoters')
      .select(`
        id, name_en, name_ar, email, mobile_number, phone,
        profile_picture_url, status, job_title,
        id_card_number, id_card_expiry_date, id_card_url,
        passport_number, passport_expiry_date, passport_url,
        nationality, date_of_birth, gender,
        employer_id, created_at, updated_at
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch promoters',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${promoters?.length || 0} promoters (total: ${count})`);
    
    // Add rate limit headers to response
    const responseHeaders = getRateLimitHeaders(rateLimitResult);
    
    return NextResponse.json({
      success: true,
      promoters: promoters || [],
      count: promoters?.length || 0,
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
    }, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error as Error).message 
          : undefined
      },
      { status: 500 }
    );
  }
});

// ✅ SECURITY: RBAC enabled with rate limiting
export const POST = withRBAC('promoter:manage:own', async (request: Request) => {
  // ✅ SECURITY: Apply rate limiting
  const identifier = getClientIdentifier(request);
  const rateLimitResult = await ratelimitStrict.limit(identifier);
  
  if (!rateLimitResult.success) {
    const headers = getRateLimitHeaders(rateLimitResult);
    const body = createRateLimitResponse(rateLimitResult);
    
    return NextResponse.json(body, {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  console.log('🔍 API /api/promoters POST called (RBAC ENABLED, Rate Limited)');
  try {
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
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      } as any,
    });

    // ✅ SECURITY: Verify authenticated user (required)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          details: 'Please log in to create promoters'
        },
        { status: 401 }
      );
    }

    console.log('👤 Authenticated user:', user.email);

    // Check if user is admin (for scoping data)
    let isAdmin = false;
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    isAdmin = (userProfile as any)?.role === 'admin';

    // Parse and validate request body
    const body = await request.json();
    const validatedData = promoterSchema.parse(body);

    // Check if ID card number already exists
    if (validatedData.id_card_number) {
      const { data: existingPromoter, error: checkError } = await supabase
        .from('promoters')
        .select('id')
        .eq('id_card_number', validatedData.id_card_number)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking ID card number:', checkError);
        return NextResponse.json(
          { error: 'Failed to validate ID card number' },
          { status: 500 }
        );
      }

      if (existingPromoter) {
        return NextResponse.json(
          { error: 'ID card number already exists for another promoter' },
          { status: 400 }
        );
      }
    }

    // NOTE: created_by column doesn't exist in promoters table yet
    // TODO: Add created_by column for better audit tracking
    const promoterData = {
      ...validatedData,
      // created_by: user.id, // Column doesn't exist yet
    };

    console.log('📝 Creating promoter (audit tracked via audit_logs table)');

    // Insert promoter into database
    const { data: promoter, error } = await supabase
      .from('promoters')
      .insert([promoterData])
      .select()
      .single();

    if (error) {
      console.error('Error creating promoter:', error);
      return NextResponse.json(
        {
          error: 'Failed to create promoter',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Create audit log
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'create',
        table_name: 'promoters',
        record_id: promoter.id,
        new_values: validatedData,
        created_at: new Date().toISOString(),
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      promoter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error as Error).message 
          : undefined
      },
      { status: 500 }
    );
  }
});

