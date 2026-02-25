import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, locale = 'en' } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }


    // Create Supabase client
    const supabase = await createClient();

    // Attempt authentication
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (authError) {

      // Check if it's a CAPTCHA error
      if (
        authError.message.includes('captcha') ||
        authError.message.includes('verification') ||
        authError.message.includes('unexpected_failure')
      ) {
        return NextResponse.json(
          {
            error:
              'CAPTCHA verification required. Please disable CAPTCHA in your Supabase Dashboard.',
            captchaRequired: true,
            instructions: {
              title: 'Disable CAPTCHA in Supabase',
              steps: [
                '1. Go to Supabase Dashboard',
                '2. Navigate to Authentication → Settings',
                '3. Find the CAPTCHA section',
                '4. Disable CAPTCHA verification',
                '5. Save changes',
              ],
              dashboardUrl: 'https://supabase.com/dashboard',
            },
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Login failed: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Login failed: No user data returned' },
        { status: 400 }
      );
    }


    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role, status')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
    }

    // Check user status
    const userStatus = (profile as any)?.status || 'active';
    if (userStatus === 'pending') {
      return NextResponse.json(
        {
          error:
            'Your account is pending approval. Please contact an administrator.',
        },
        { status: 400 }
      );
    }

    if (userStatus === 'inactive') {
      return NextResponse.json(
        {
          error:
            'Your account has been deactivated. Please contact an administrator.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      session: authData.session,
      profile,
      redirectPath: getRedirectPath(
        (profile as any)?.role || authData.user.user_metadata?.role || 'user',
        locale
      ),
    });
  } catch (error) {

    // Enhanced error logging for debugging
    if (error instanceof Error) {

      // Check for specific Supabase client errors
      if (error.message.includes('Supabase client initialization failed')) {
        return NextResponse.json(
          {
            error:
              'Database connection failed. Please check server configuration.',
            details: 'Supabase client could not be initialized',
            code: 'SUPABASE_INIT_ERROR',
          },
          { status: 500 }
        );
      }

      if (error.message.includes('Missing Supabase environment variables')) {
        return NextResponse.json(
          {
            error: 'Server configuration error. Missing database credentials.',
            details: 'Required environment variables are not set',
            code: 'MISSING_ENV_VARS',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

function getRedirectPath(role: string, locale: string = 'en'): string {
  switch (role) {
    case 'provider':
      return `/${locale}/dashboard/provider-comprehensive`;
    case 'client':
      return `/${locale}/dashboard/client-comprehensive`;
    case 'admin':
    case 'super_admin':
      return `/${locale}/dashboard`;
    case 'hr_admin':
    case 'hr_staff':
      return `/${locale}/hr`;
    default:
      return `/${locale}/dashboard`;
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const envCheck = {
      supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
      supabaseAnonKey: supabaseAnonKey ? '✅ Set' : '❌ Missing',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };

    // Test Supabase client creation
    let supabaseStatus = 'Unknown';
    try {
      const _supabase = await createClient();
      supabaseStatus = '✅ Connected';
    } catch (error) {
      supabaseStatus = `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      captchaRequired: false,
      environment: process.env.NODE_ENV,
      message: 'Simple login API is ready',
      status: 'healthy',
      environmentCheck: envCheck,
      supabaseStatus,
      ready: supabaseUrl && supabaseAnonKey && supabaseStatus.includes('✅'),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'unhealthy',
      },
      { status: 500 }
    );
  }
}
