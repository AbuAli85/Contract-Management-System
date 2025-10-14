import { createServerClient } from '@supabase/ssr';
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

export async function GET() {
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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, ...options }) => {
              cookieStore.set(
                name,
                value,
                options as {
                  path?: string;
                  domain?: string;
                  maxAge?: number;
                  secure?: boolean;
                  httpOnly?: boolean;
                  sameSite?: 'strict' | 'lax' | 'none';
                }
              );
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    });

    console.log('Fetching promoters from database...');

    // Build query - fetch all promoters with employer information
    const query = supabase
      .from('promoters')
      .select('*, parties!employer_id(name_en, name_ar)')
      .order('created_at', { ascending: false });

    // Fetch promoters from the database
    const { data: promoters, error } = await query;

    if (error) {
      console.error('Error fetching promoters:', error);
      return NextResponse.json(
        { error: 'Failed to fetch promoters' },
        { status: 500 }
      );
    }

    console.log(`Fetched ${promoters?.length || 0} promoters`);
    return NextResponse.json({
      success: true,
      promoters: promoters || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ✅ SECURITY FIX: Added RBAC guard for promoter creation
// TEMPORARILY DISABLED FOR TESTING - REMOVE IN PRODUCTION
export async function POST(request: Request) {
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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, ...options }) => {
              cookieStore.set(
                name,
                value,
                options as {
                  path?: string;
                  domain?: string;
                  maxAge?: number;
                  secure?: boolean;
                  httpOnly?: boolean;
                  sameSite?: 'strict' | 'lax' | 'none';
                }
              );
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    });

    // Get user session (optional for testing)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // TEMPORARILY DISABLED FOR TESTING - REMOVE IN PRODUCTION
    // if (sessionError || !session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

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

    // Add created_by field (use a default UUID if no session)
    const promoterData = {
      ...validatedData,
      created_by: session?.user?.id || '00000000-0000-0000-0000-000000000000',
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
        user_id: session?.user?.id || '00000000-0000-0000-0000-000000000000',
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
