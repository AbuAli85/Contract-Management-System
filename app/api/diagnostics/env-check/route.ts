import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint to check if environment variables are loaded.
 * PROTECTED: Admin-only endpoint.
 */
export async function GET() {
  try {
    // Admin-only: require authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    const envCheck = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseAnonKey: !!supabaseAnonKey,
      hasServiceKey,
      // Show only a preview of the keys, never the full value
      supabaseUrlPreview: supabaseUrl
        ? `${supabaseUrl.substring(0, 20)}...${supabaseUrl.substring(supabaseUrl.length - 15)}`
        : 'NOT SET',
      anonKeyPreview: supabaseAnonKey
        ? `${supabaseAnonKey.substring(0, 20)}...`
        : 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: envCheck.hasSupabaseUrl && envCheck.hasSupabaseAnonKey,
      environment: envCheck,
      message:
        envCheck.hasSupabaseUrl && envCheck.hasSupabaseAnonKey
          ? 'Environment variables are configured correctly'
          : 'Environment variables are missing',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
