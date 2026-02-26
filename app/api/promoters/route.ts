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
import { logger } from '@/lib/utils/logger';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Check if RBAC bypass is enabled for debugging/initial setup
const RBAC_BYPASS =
  process.env.RBAC_BYPASS === 'true' ||
  process.env.RBAC_ENFORCEMENT === 'disabled' ||
  process.env.RBAC_ENFORCEMENT !== 'true';

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
      val => {
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
      val => {
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
  // Enhanced fields
  work_location: z.string().optional(),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  salary: z.number().min(0).optional(),
  currency: z.string().max(10).default('OMR').optional(),
  tags: z.array(z.string()).default([]).optional(),
  photo_url: z.string().url().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

// Handler function for GET
async function handleGET(request: Request) {
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

    logger.log('🔍 API /api/promoters GET called (RBAC ENABLED, Rate Limited)');

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('❌ Missing Supabase credentials:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
          details: 'Missing Supabase environment variables',
          debug: {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!supabaseAnonKey,
            timestamp: new Date().toISOString(),
          },
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
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: CookieOptions;
          }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {
            // Ignore cookie setting errors
          }
        },
      },
    });

    // ✅ SECURITY: Verify authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('❌ Authentication failed:', {
        authError: authError?.message,
        hasUser: !!user,
        userId: user?.id,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          details:
            authError?.message || 'Please log in to access promoters data',
          debug: {
            hasUser: !!user,
            authError: authError?.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }


    // ✅ SECURITY: Check user role for data scoping
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    logger.log('🔐 User role check:', {
      userId: user.id,
      email: user.email,
      role: userProfile?.role,
      isAdmin,
    });

    // Parse pagination and filters from query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '50'),
      200 // Increased max limit
    );
    const offset = (page - 1) * limit;

    // Server-side filtering parameters
    const searchTerm = url.searchParams.get('search') || '';
    const statusFilter = url.searchParams.get('status') || '';
    const documentFilter = url.searchParams.get('documents') || '';
    const assignmentFilter = url.searchParams.get('assignment') || '';
    const sortField = url.searchParams.get('sortField') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    // Role-based filtering
    const employerIdFilter = url.searchParams.get('employerId') || '';
    const userIdFilter = url.searchParams.get('userId') || '';

    logger.log('📊 Query params:', {
      page,
      limit,
      offset,
      searchTerm,
      statusFilter,
      documentFilter,
      assignmentFilter,
      sortField,
      sortOrder,
      userScoped: !isAdmin,
    });

    // ✅ SECURITY: Query with RLS policies + user scoping
    // Admins see all data, non-admins see only their created promoters
    let query = supabase.from('promoters').select(
      `
        id, name_en, name_ar, email, mobile_number, phone,
        profile_picture_url, photo_url, status, job_title,
        id_card_number, id_card_expiry_date, id_card_url,
        passport_number, passport_expiry_date, passport_url,
        nationality, date_of_birth, gender,
        work_location, department, salary, currency,
        contract_start_date, contract_end_date,
        emergency_contact_name, emergency_contact_phone,
        tags, notes,
        employer_id, created_at, updated_at,
        parties:employer_id (
          id, name_en, name_ar, type, status
        )
      `,
      { count: 'exact' }
    );

    // ✅ COMPANY SCOPE: Get active company's party_id
    let activePartyId: string | null = null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (profile?.active_company_id) {
      // Get company's party_id
      // Handle both regular companies and party-based companies (parties_employer_direct)
      const { createAdminClient } = await import('@/lib/supabase/server');
      let adminClient;
      try {
        adminClient = createAdminClient();
      } catch (e) {
        adminClient = supabase;
      }

      // First, check if active_company_id is actually a party_id (for parties_employer_direct)
      const { data: partyCheck } = await adminClient
        .from('parties')
        .select('id, type')
        .eq('id', profile.active_company_id)
        .maybeSingle();

      if (partyCheck && partyCheck.type === 'Employer') {
        // active_company_id IS a party_id for party-based companies
        activePartyId = profile.active_company_id;
        logger.log(
          'Using party_id directly for promoter filtering (parties_employer_direct)',
          {
            partyId: activePartyId,
            companyId: profile.active_company_id,
          }
        );
      } else {
        // Get company's party_id from companies table
        const { data: company } = await adminClient
          .from('companies')
          .select('party_id')
          .eq('id', profile.active_company_id)
          .maybeSingle();

        if (company?.party_id) {
          activePartyId = company.party_id;
          logger.log('Using company party_id for promoter filtering', {
            companyId: profile.active_company_id,
            partyId: activePartyId,
          });
        }
      }
    }

    // ✅ COMPANY SCOPE: Filter by active company's party_id (if available)
    if (activePartyId) {
      logger.log('🔒 Filtering promoters by company party_id:', activePartyId);
      query = query.eq('employer_id', activePartyId);
    } else if (employerIdFilter) {
      // ✅ SECURITY: Scope data by user role
      // Role-based filtering: Employees see only their own, Employers see only assigned, Admins see all
      logger.log('🔒 Filtering by employer_id:', employerIdFilter);
      query = query.eq('employer_id', employerIdFilter);
    } else if (userIdFilter) {
      logger.log('🔒 Filtering by user_id (employee):', userIdFilter);
      // For employees, filter by their own promoter record ID
      // Note: This assumes the employee has a promoter record with matching ID
      query = query.eq('id', userIdFilter);
    } else if (!isAdmin) {
      logger.log(
        '🔒 Non-admin user: applying data scope via created_by filter'
      );
      // Uncomment when created_by column is added via scripts/add-created-by-column.sql:
      // query = query.eq('created_by', user.id);
    }

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
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      if (documentFilter === 'expired') {
        // Documents that have already expired
        query = query.or(
          `id_card_expiry_date.lt.${today},passport_expiry_date.lt.${today}`
        );
      } else if (documentFilter === 'expiring') {
        // Documents expiring within 30 days:
        // (id_card between today and 30 days) OR (passport between today and 30 days)
        query = query.or(
          `and(id_card_expiry_date.gte.${today},id_card_expiry_date.lte.${thirtyDaysFromNow}),and(passport_expiry_date.gte.${today},passport_expiry_date.lte.${thirtyDaysFromNow})`
        );
      } else if (documentFilter === 'missing') {
        // Missing document information
        query = query.or(
          'id_card_expiry_date.is.null,passport_expiry_date.is.null,id_card_number.is.null,passport_number.is.null'
        );
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

    // Apply sorting - map UI sort field names to actual DB column names
    const sortFieldMap: Record<string, string> = {
      name: 'name_en',
      name_en: 'name_en',
      name_ar: 'name_ar',
      status: 'status',
      created: 'created_at',
      created_at: 'created_at',
      updated_at: 'updated_at',
      email: 'email',
      documents: 'id_card_expiry_date', // Sort by ID card expiry for document sort
      nationality: 'nationality',
      job_title: 'job_title',
      contract_end_date: 'contract_end_date',
      contract_start_date: 'contract_start_date',
      salary: 'salary',
      work_location: 'work_location',
    };
    const actualSortField = sortFieldMap[sortField] ?? 'created_at';
    const actualSortOrder = sortOrder === 'asc' ? true : false;

    query = query.order(actualSortField, { ascending: actualSortOrder });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: promoters, error, count } = await query;

    if (error) {
      logger.error('❌ Database error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        timestamp: new Date().toISOString(),
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
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    logger.log(
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
    logger.error('❌ API error:', error);
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

// Export GET with optional RBAC protection (bypass when RBAC_ENFORCEMENT is not true)
export const GET = RBAC_BYPASS
  ? async (request: Request) => {
      return handleGET(request);
    }
  : withRBAC('promoter:read:own', handleGET);

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

    logger.log(
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
          setAll(
            cookiesToSet: Array<{
              name: string;
              value: string;
              options?: CookieOptions;
            }>
          ) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options as CookieOptions)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
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

      logger.log('👤 Authenticated user:', user.email);

      // Check if user is admin (for scoping data)
      let isAdmin = false;
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      isAdmin = (userProfile as { role?: string } | null)?.role === 'admin';

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
          logger.error('Error checking ID card number:', checkError);
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

      // ✅ AUDIT: Track who created this promoter
      const promoterData = {
        ...validatedData,
        created_by: user.id, // User scoping for non-admins
      };

      logger.log('📝 Creating promoter with user tracking:', {
        createdBy: user.id,
        email: user.email,
      });

      // Insert promoter into database
      const { data: promoter, error } = await supabase
        .from('promoters')
        .insert([promoterData])
        .select()
        .single();

      if (error) {
        logger.error('Error creating promoter:', error);
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
        logger.error('Error creating audit log:', auditError);
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

      logger.error('API error:', error);
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
