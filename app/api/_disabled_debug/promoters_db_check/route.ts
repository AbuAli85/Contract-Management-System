import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Supabase credentials',
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey,
          },
        },
        { status: 500 }
      );
    }

    // Create client with SERVICE_ROLE key (bypasses RLS)
    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      } as any,
    });


    // Test 1: Count all records
    const { count: totalCount, error: countError } = await supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true });


    // Test 2: Get first 5 records
    const { data: promoters, error: fetchError } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, email, status, created_at')
      .limit(5)
      .order('created_at', { ascending: false });


    // Test 3: Check RLS policies
    const { data: _policies, error: policiesError } = await supabase
      .rpc('pg_policies')
      .eq('tablename', 'promoters')
      .select('*')
      .limit(10);


    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        totalRecords: totalCount,
        countError: countError?.message,
        fetchedRecords: promoters?.length || 0,
        fetchError: fetchError?.message,
        sampleData: promoters?.slice(0, 2),
      },
      configuration: {
        usingServiceKey: true,
        serviceKeyPresent: !!supabaseServiceKey,
        nodeEnv: process.env.NODE_ENV,
      },
      debug: {
        supabaseUrl,
        keyType: 'SERVICE_ROLE',
        rlsPoliciesChecked: !policiesError,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database check failed',
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
