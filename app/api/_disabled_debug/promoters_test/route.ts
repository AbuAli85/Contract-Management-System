import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// 🔧 TEMPORARY TEST ENDPOINT - No RBAC protection
export async function GET() {
  try {

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


    if (!supabaseUrl || !supabaseKey) {
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Execute query - SERVICE_ROLE key bypasses RLS
    const {
      data: promoters,
      error,
      count,
    } = await supabase
      .from('promoters')
      .select('*', { count: 'exact' })
      .range(0, 4) // Just get first 5 for testing
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch promoters',
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }


    if (promoters && promoters.length > 0) {
    }

    return NextResponse.json({
      success: true,
      promoters: promoters || [],
      count: promoters?.length || 0,
      total: count || 0,
      timestamp: new Date().toISOString(),
      debug: {
        userEmail: user?.email,
        usingServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasPromoters: (promoters?.length || 0) > 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
