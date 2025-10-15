import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC } from '@/lib/rbac/guard';

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

// ✅ SECURITY: Protected with RBAC guard for viewing promoters
export const GET = withRBAC('promoter:view', async () => {
  try {
    console.log('🔍 API /api/promoters called');
    
    // Force load environment variables
    if (process.env.NODE_ENV !== 'production') {
      try {
        const { config } = await import('dotenv');
        config({ path: '.env.local' });
        console.log('📁 Loaded .env.local file');
      } catch (error) {
        console.log('⚠️ Could not load .env.local:', error);
      }
    }
    
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // ✅ SECURITY FIX: Use anon key to respect RLS policies
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('🔑 Environment check:', {
      hasUrl: !!supabaseUrl,
      urlPrefix: supabaseUrl?.substring(0, 20),
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      usingKey: 'ANON', // Always use anon key to respect RLS
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials!');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Server configuration error: Missing Supabase environment variables',
          details: 'Please check .env.local file' 
        },
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
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      } as any,
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          details: 'Please log in to view promoters' 
        },
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

    console.log('Fetching promoters from database...');
    console.log('User status:', `Logged in as ${user.email}`);
    console.log('Is admin:', isAdmin);

    // Build query with proper RLS - anon key respects RLS policies
    console.log('📊 Executing Supabase query with RLS...');
    let query = supabase
      .from('promoters')
      .select('*');

    // If not admin, only show promoters created by this user
    if (!isAdmin) {
      query = query.eq('created_by', user.id);
      console.log(`Fetching promoters for user: ${user.id} (non-admin)`);
    }

    const { data: promoters, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching promoters:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
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

    console.log(`✅ Successfully fetched ${promoters?.length || 0} promoters`);
    
    if (promoters && promoters.length > 0) {
      console.log('📋 Sample promoter:', {
        id: promoters[0].id,
        name_en: promoters[0].name_en,
        employer_id: promoters[0].employer_id,
      });
    } else {
      console.warn('⚠️ No promoters found in database');
    }
    
    return NextResponse.json({
      success: true,
      promoters: promoters || [],
      count: promoters?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// ✅ SECURITY: Protected with RBAC guard for creating promoters
export const POST = withRBAC('promoter:create', async (request: Request) => {
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

    // Add created_by field from authenticated user
    const promoterData = {
      ...validatedData,
      created_by: user.id,
    };

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
});
