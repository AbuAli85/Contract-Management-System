import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  rateLimiters,
  getRateLimitHeaders,
  getClientIdentifier,
} from '@/lib/security/upstash-rate-limiter';
import {
  validatePasswordComprehensive,
  hashPasswordForHistory,
} from '@/lib/security/password-validation';

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Apply strict rate limiting for registration (3 requests per hour per IP)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimiters.registration.limit(identifier);

    if (!rateLimitResult.success) {
      const headers = getRateLimitHeaders({
        success: rateLimitResult.success,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      });

      // Log rate limit violation
      const violation = {
        timestamp: new Date().toISOString(),
        endpoint: '/api/auth/register',
        method: 'POST',
        ip: identifier.split(':')[0],
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        retryInMinutes: Math.ceil((rateLimitResult.reset - Date.now()) / 60000),
      };
      console.warn(
        '⚠️ Registration rate limit exceeded:',
        JSON.stringify(violation)
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many registration attempts. Please try again in ${Math.ceil((rateLimitResult.reset - Date.now()) / 60000)} minutes.`,
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers,
        }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    const { email, password, fullName, role, phone, company } = body;

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, fullName, role' },
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

    // ✅ ENHANCED: Comprehensive password validation
    const validation = await validatePasswordComprehensive(
      password,
      undefined,
      {
        checkBreach: true,
        checkHistory: false, // No history for new users
        requireMinimumStrength: true,
      }
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
          strength: validation.strength,
        },
        { status: 400 }
      );
    }

    // Check for breached password
    if (validation.breachInfo?.isBreached) {
      return NextResponse.json(
        {
          success: false,
          error: 'Breached password detected',
          message: `This password has been found in ${validation.breachInfo.breachCount.toLocaleString()} data breaches. Please choose a more secure password.`,
        },
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

    console.log('🔐 Register API - Starting registration for:', email);

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
          phone: phone?.trim() || null,
          company: company?.trim() || null,
        },
      },
    });

    if (authError) {
      console.error('🔐 Register API - Auth error:', authError);
      return NextResponse.json(
        { error: `Registration failed: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Registration failed: No user data returned' },
        { status: 500 }
      );
    }

    console.log('🔐 Register API - Auth user created:', authData.user.id);

    // Step 2: Create user profile
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: email.trim(),
      full_name: fullName.trim(),
      role,
      status: 'active', // Auto-approve for demo purposes
      phone: phone?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('🔐 Register API - Profile error:', profileError);
      // Don't fail the registration if profile creation fails
      console.warn(
        'Profile creation failed, but auth user was created successfully'
      );
    } else {
      console.log('🔐 Register API - Profile created successfully');
    }

    // Step 3: Add password to history
    try {
      const passwordHash = await hashPasswordForHistory(password);
      const { error: historyError } = await supabase
        .from('password_history')
        .insert({
          user_id: authData.user.id,
          password_hash: passwordHash,
          created_at: new Date().toISOString(),
        });

      if (historyError) {
        console.error(
          '🔐 Register API - Password history error:',
          historyError
        );
        // Don't fail registration if history save fails
      } else {
        console.log('🔐 Register API - Password added to history');
      }
    } catch (histError) {
      console.error('🔐 Register API - Password history exception:', histError);
      // Don't fail registration
    }

    // Step 4: Create company if provider
    if (role === 'provider' && company) {
      const { error: companyError } = await supabase.from('companies').insert({
        name: company.trim(),
        owner_id: authData.user.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (companyError) {
        console.warn('Company creation failed:', companyError);
      } else {
        console.log('Company created successfully');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName.trim(),
        role,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('🔐 Register API - Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
