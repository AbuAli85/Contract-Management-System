import { NextRequest, NextResponse } from 'next/server';
import { productionAuthService } from '@/lib/auth/production-auth-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, phone, company, captchaToken } =
      body;

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Email, password, full name, and role are required' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['user', 'provider', 'client', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          error: 'Invalid role. Must be one of: user, provider, client, admin',
        },
        { status: 400 }
      );
    }

    // Get client information
    const ipAddress = productionAuthService.getClientIP(request);
    const userAgent = productionAuthService.getUserAgent(request);

    // Check if CAPTCHA is required
    const captchaRequired = productionAuthService.isCaptchaRequired(request);

    if (captchaRequired && !captchaToken) {
      return NextResponse.json(
        {
          error: 'CAPTCHA verification required',
          captchaRequired: true,
          captchaConfig: productionAuthService.getCaptchaConfig(),
        },
        { status: 400 }
      );
    }

    // Attempt registration
    try {
      const authData = await productionAuthService.signUp(
        email,
        password,
        {
          fullName,
          role,
          phone,
          company,
        },
        {
          captchaToken,
          ipAddress,
          userAgent,
        }
      );

      if (!authData.user) {
        throw new Error('Registration failed: No user data returned');
      }

      // Create user profile in database
      const supabase = await createClient();
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        status: 'pending', // Require admin approval in production
        phone: phone?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the registration if profile creation fails
        console.warn(
          'Profile creation failed, but auth user was created successfully'
        );
      }

      // Create company if provider
      if (role === 'provider' && company) {
        const { error: companyError } = await supabase
          .from('companies')
          .insert({
            name: company.trim(),
            owner_id: authData.user.id,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (companyError) {
          console.warn('Company creation failed:', companyError);
        }
      }

      // Log successful registration
      await productionAuthService.logAuthAttempt(
        'signup',
        email,
        true,
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        message: 'Registration successful. Please wait for admin approval.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          role,
          status: 'pending',
        },
      });
    } catch (authError) {
      // Log failed registration
      await productionAuthService.logAuthAttempt(
        'signup',
        email,
        false,
        ipAddress,
        userAgent,
        authError instanceof Error ? authError.message : 'Unknown error'
      );

      // Check if it's a CAPTCHA error
      if (
        authError instanceof Error &&
        (authError.message.includes('captcha') ||
          authError.message.includes('verification'))
      ) {
        return NextResponse.json(
          {
            error: 'CAPTCHA verification failed',
            captchaRequired: true,
            captchaConfig: productionAuthService.getCaptchaConfig(),
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error:
            authError instanceof Error
              ? authError.message
              : 'Registration failed',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Production registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return CAPTCHA configuration for client-side
    const captchaConfig = productionAuthService.getCaptchaConfig();
    const captchaRequired = productionAuthService.isCaptchaRequired(request);

    return NextResponse.json({
      captchaRequired,
      captchaConfig,
      environment: process.env.NODE_ENV,
      validRoles: ['user', 'provider', 'client', 'admin'],
    });
  } catch (error) {
    console.error('Production registration config error:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}
