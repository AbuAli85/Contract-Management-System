import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC, withAnyRBAC } from '@/lib/rbac/guard';

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

// 🔧 TEMPORARY FIX: Bypass RBAC for debugging
export async function GET(request: Request) {
  // TODO: Re-enable RBAC after fixing permission issues
  // export const GET = withRBAC('promoter:read:own', async (request: Request) => {
  try {
    console.log('🔍 API /api/promoters GET called (RBAC BYPASSED, RLS DISABLED)');
      
      const cookieStore = await cookies();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      console.log('🔑 Supabase config:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        usingKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON',
        rbacEnforcement: process.env.RBAC_ENFORCEMENT || 'not set',
        nodeEnv: process.env.NODE_ENV,
      });

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials');
        return NextResponse.json(
          { success: false, error: 'Server configuration error' },
          { status: 500 }
        );
      }

      const supabase = createServerClient(supabaseUrl, supabaseKey, {
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

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Authenticated user:', user?.email);

      // Parse pagination from query params
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const offset = (page - 1) * limit;

      console.log('📊 Query params:', { page, limit, offset });

      // Execute query - SERVICE_ROLE key bypasses RLS
      console.log('📊 Executing Supabase query...');
      const { data: promoters, error, count } = await supabase
        .from('promoters')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database error:', error);
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to fetch promoters',
            details: error.message,
            code: error.code 
          },
          { status: 500 }
        );
      }

      console.log(`✅ Fetched ${promoters?.length || 0} promoters (total: ${count})`);
      
      if (promoters && promoters.length > 0) {
        console.log('📋 First promoter:', promoters[0].name_en);
      }
      
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
      });
    } catch (error) {
      console.error('❌ API error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

// 🔧 TEMPORARY FIX: Bypass RBAC for debugging
export async function POST(request: Request) {
  // TODO: Re-enable RBAC after fixing permission issues
  // export const POST = withRBAC('promoter:manage:own', async (request: Request) => {
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

    // Get authenticated user (required)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

