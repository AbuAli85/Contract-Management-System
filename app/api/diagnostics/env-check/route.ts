import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint to check if environment variables are loaded
 * This helps verify if env vars are set in production
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Don't expose the actual keys, just check if they exist
  const envCheck = {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseAnonKey: !!supabaseAnonKey,
    hasServiceKey,
    supabaseUrlPreview: supabaseUrl
      ? `${supabaseUrl.substring(0, 20)}...${supabaseUrl.substring(supabaseUrl.length - 15)}`
      : 'NOT SET',
    anonKeyPreview: supabaseAnonKey
      ? `${supabaseAnonKey.substring(0, 20)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 20)}`
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
        ? '✅ Environment variables are set correctly'
        : '❌ Environment variables are missing. Please set them in Vercel and redeploy.',
  });
}
