import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are set (without exposing sensitive values)
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasMakeWebhookUrl: !!process.env.MAKE_WEBHOOK_URL,
      hasSlackWebhookUrl: !!process.env.SLACK_WEBHOOK_URL,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    };

    return NextResponse.json({
      success: true,
      env: envCheck,
    });
  } catch (error) {
    console.error('Environment debug error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check environment variables',
      },
      { status: 500 }
    );
  }
}
