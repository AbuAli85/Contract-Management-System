import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
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

    // Step 3: Create company if provider
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
