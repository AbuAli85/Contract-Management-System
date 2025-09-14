import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      fullName, 
      role, 
      phone, 
      company 
    } = body;

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
        { error: 'Invalid role. Must be one of: user, provider, client, admin' },
        { status: 400 }
      );
    }

    console.log('🔐 Simple Register - Starting registration process...');
    console.log('🔐 Simple Register - Email:', email);
    console.log('🔐 Simple Register - Role:', role);

    // Create Supabase client
    const supabase = await createClient();

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
      console.error('🔐 Simple Register - Auth error:', authError);
      
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
        { error: `Registration failed: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Registration failed: No user data returned' },
        { status: 400 }
      );
    }

    console.log('🔐 Simple Register - Auth user created:', authData.user.id);

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
      console.error('🔐 Simple Register - Profile error:', profileError);
      // Don't fail the registration if profile creation fails
      console.warn('Profile creation failed, but auth user was created successfully');
    } else {
      console.log('🔐 Simple Register - Profile created successfully');
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
      success: true,
      message: 'Registration successful! You can now sign in.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        role,
        status: 'active',
      },
    });

  } catch (error) {
    console.error('🔐 Simple Register - Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      captchaRequired: false,
      environment: process.env.NODE_ENV,
      validRoles: ['user', 'provider', 'client', 'admin'],
      message: 'Simple register API is ready'
    });
  } catch (error) {
    console.error('Simple register config error:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}
