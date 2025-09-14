import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

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

    console.log('🔐 Simple Login - Starting login process...');
    console.log('🔐 Simple Login - Email:', email);

    // Create Supabase client
    const supabase = await createClient();

    // Attempt authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      console.error('🔐 Simple Login - Auth error:', authError);
      
      // Check if it's a CAPTCHA error
      if (authError.message.includes('captcha') || authError.message.includes('verification') || authError.message.includes('unexpected_failure')) {
        return NextResponse.json(
          { 
            error: 'CAPTCHA verification required. Please disable CAPTCHA in your Supabase Dashboard.',
            captchaRequired: true,
            instructions: {
              title: 'Disable CAPTCHA in Supabase',
              steps: [
                '1. Go to Supabase Dashboard',
                '2. Navigate to Authentication → Settings',
                '3. Find the CAPTCHA section',
                '4. Disable CAPTCHA verification',
                '5. Save changes'
              ],
              dashboardUrl: 'https://supabase.com/dashboard'
            }
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

    console.log('🔐 Simple Login - Auth successful:', authData.user.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role, status')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.warn('Profile fetch error:', profileError);
    }

    // Check user status
    const userStatus = profile?.status || 'active';
    if (userStatus === 'pending') {
      return NextResponse.json(
        { error: 'Your account is pending approval. Please contact an administrator.' },
        { status: 400 }
      );
    }

    if (userStatus === 'inactive') {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact an administrator.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      session: authData.session,
      profile: profile,
      redirectPath: getRedirectPath(profile?.role || authData.user.user_metadata?.role || 'user')
    });

  } catch (error) {
    console.error('🔐 Simple Login - Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getRedirectPath(role: string): string {
  switch (role) {
    case 'provider':
      return '/en/dashboard/provider-comprehensive';
    case 'client':
      return '/en/dashboard/client-comprehensive';
    case 'admin':
    case 'super_admin':
      return '/en/dashboard';
    case 'hr_admin':
    case 'hr_staff':
      return '/en/hr';
    default:
      return '/en/dashboard';
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      captchaRequired: false,
      environment: process.env.NODE_ENV,
      message: 'Simple login API is ready'
    });
  } catch (error) {
    console.error('Simple login config error:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}
