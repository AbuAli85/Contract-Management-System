import { NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';

/**
 * DEBUG ENDPOINT
 * Check environment configuration and database connectivity
 * Access: GET /api/promoters/debug
 *
 * ⚠️ PROTECTED: Admin-only access, disabled in production ⚠️
 */
export const GET = withRBAC('admin:debug', async (_request: Request) => {
  // Completely disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  console.log('🔍 Debug endpoint accessed (development only)');

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseUrlPrefix: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 25)}...`,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKeyPrefix: `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyPrefix: `${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...`,
    },
    status: 'checking',
    message: '',
    errors: [] as string[],
  };

  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    diagnostics.errors.push('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    diagnostics.errors.push(
      '❌ Neither NEXT_PUBLIC_SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY is set'
    );
  }

  if (diagnostics.errors.length > 0) {
    diagnostics.status = 'error';
    diagnostics.message =
      'Missing required Supabase environment variables. Please create .env.local file.';

    return NextResponse.json(diagnostics, { status: 500 });
  }

  // Try to connect to Supabase
  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test query
    const { _data, error, count } = await supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true });

    if (error) {
      diagnostics.status = 'error';
      diagnostics.message = 'Failed to connect to Supabase';
      diagnostics.errors.push(`Database error: ${error.message}`);

      if (error.code) {
        diagnostics.errors.push(`Error code: ${error.code}`);
      }

      return NextResponse.json(diagnostics, { status: 500 });
    }

    diagnostics.status = 'success';
    diagnostics.message = `✅ Connected successfully! Found ${count || 0} promoters in database.`;

    return NextResponse.json({
      ...diagnostics,
      database: {
        connected: true,
        promotersCount: count || 0,
      },
      recommendations:
        count === 0
          ? [
              'Database is empty. You may need to:',
              '1. Import data from a CSV/SQL file',
              '2. Use the "Add Promoter" button to create entries',
              "3. Check if you're connected to the correct Supabase project",
            ]
          : [
              'Everything looks good!',
              "If promoters still don't show:",
              '1. Clear browser cache (Ctrl+Shift+R)',
              '2. Check browser console for errors',
              '3. Verify Row Level Security (RLS) policies in Supabase',
            ],
    });
  } catch (error) {
    diagnostics.status = 'error';
    diagnostics.message = 'Unexpected error during diagnostics';
    diagnostics.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(diagnostics, { status: 500 });
  }
});
