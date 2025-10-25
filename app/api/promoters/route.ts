import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC, withAnyRBAC } from '@/lib/rbac/guard';
import {
  ratelimitStrict,
  getClientIdentifier,
  getRateLimitHeaders,
  createRateLimitResponse,
} from '@/lib/rate-limit';

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
  mobile_number: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true; // Optional field
        const digitsOnly = val.replace(/\D/g, '');
        // Must have at least 10 digits and not be incomplete (> 4 digits)
        return digitsOnly.length >= 10 && digitsOnly.length <= 15;
      },
      {
        message:
          'Mobile number must be complete (10-15 digits including country code). Example: +968 9123 4567',
      }
    ),
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
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true; // Optional field
        const digitsOnly = val.replace(/\D/g, '');
        // Must have at least 10 digits and not be incomplete (> 4 digits)
        return digitsOnly.length >= 10 && digitsOnly.length <= 15;
      },
      {
        message:
          'Phone number must be complete (10-15 digits including country code). Example: +968 9123 4567',
      }
    ),
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

    console.log(
      '🔍 API /api/promoters GET called (RBAC ENABLED, Rate Limited)'
    );

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
              cookieStore.set(name, value, options as CookieOptions)
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
          details: authError?.message || 'Please log in to access promoters data',
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

    // Parse pagination and filters from query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '50'),
      100
    );
    const offset = (page - 1) * limit;
    
    // Server-side filtering parameters
    const searchTerm = url.searchParams.get('search') || '';
    const statusFilter = url.searchParams.get('status') || '';
    const documentFilter = url.searchParams.get('documents') || '';
    const assignmentFilter = url.searchParams.get('assignment') || '';
    const sortField = url.searchParams.get('sortField') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    console.log('📊 Query params:', { 
      page, limit, offset, searchTerm, statusFilter, 
      documentFilter, assignmentFilter, sortField, sortOrder 
    });

    // ✅ SECURITY: Query with RLS policies - only returns authorized data
    // Build the query with server-side filtering
    let query = supabase
      .from('promoters')
      .select(
        `
        id, name_en, name_ar, email, mobile_number, phone,
        profile_picture_url, status, job_title,
        id_card_number, id_card_expiry_date, id_card_url,
        passport_number, passport_expiry_date, passport_url,
        nationality, date_of_birth, gender,
        employer_id, created_at, updated_at,
        parties:employer_id (
          id, name_en, name_ar, type, status
        )
      `,
        { count: 'exact' }
      );

    // Apply search filter
    if (searchTerm) {
      query = query.or(
        `name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,mobile_number.ilike.%${searchTerm}%,id_card_number.ilike.%${searchTerm}%`
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'active') {
        query = query.eq('status', 'active');
      } else if (statusFilter === 'inactive') {
        query = query.in('status', ['inactive', 'suspended', 'terminated']);
      } else if (statusFilter === 'warning') {
        // Documents expiring soon or other warning conditions
        query = query.or('status.eq.suspended,status.eq.probation');
      } else if (statusFilter === 'critical') {
        // Critical status: expired documents or suspended/terminated promoters
        const today = new Date().toISOString().split('T')[0];
        query = query.or(
          `status.in.("suspended","terminated","blocked"),id_card_expiry_date.lt.${today},passport_expiry_date.lt.${today}`
        );
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    // Apply document filter
    if (documentFilter && documentFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      if (documentFilter === 'expired') {
        // Documents that have already expired
        query = query.or(`id_card_expiry_date.lt.${today},passport_expiry_date.lt.${today}`);
      } else if (documentFilter === 'expiring') {
        // Documents expiring within 30 days
        query = query.or(
          `id_card_expiry_date.gte.${today},id_card_expiry_date.lte.${thirtyDaysFromNow},passport_expiry_date.gte.${today},passport_expiry_date.lte.${thirtyDaysFromNow}`
        );
      } else if (documentFilter === 'missing') {
        // Missing document information
        query = query.or('id_card_expiry_date.is.null,passport_expiry_date.is.null,id_card_number.is.null,passport_number.is.null');
      }
    }

    // Apply assignment filter
    if (assignmentFilter && assignmentFilter !== 'all') {
      if (assignmentFilter === 'assigned') {
        query = query.not('employer_id', 'is', null);
      } else if (assignmentFilter === 'unassigned') {
        query = query.is('employer_id', null);
      }
    }

    // Apply sorting
    const validSortFields = ['name_en', 'name_ar', 'email', 'status', 'created_at', 'updated_at'];
    const actualSortField = validSortFields.includes(sortField) ? sortField : 'created_at';
    const actualSortOrder = sortOrder === 'asc' ? true : false;
    
    query = query.order(actualSortField, { ascending: actualSortOrder });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: promoters, error, count } = await query;

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
          error: 'Failed to fetch promoters',
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
      `✅ Fetched ${promoters?.length || 0} promoters (total: ${count})`
    );

    // Add rate limit headers to response
    const responseHeaders = getRateLimitHeaders(rateLimitResult);

    return NextResponse.json(
      {
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
      },
      {
        headers: responseHeaders,
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

// ✅ SECURITY: RBAC enabled with rate limiting
export const POST = withRBAC(
  'promoter:manage:own',
  async (request: Request) => {
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

    console.log(
      '🔍 API /api/promoters POST called (RBAC ENABLED, Rate Limited)'
    );
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
            details: 'Please log in to create promoters',
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
          details:
            process.env.NODE_ENV === 'development'
              ? (error as Error).message
              : undefined,
        },
        { status: 500 }
      );
    }
  }
);
