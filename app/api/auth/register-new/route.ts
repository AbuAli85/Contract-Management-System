import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { email, password, fullName, role, phone, company } = body;

    console.log('🔐 Registration API - Starting for:', email, role);

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['provider', 'client', 'admin', 'user'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirmed_at: new Date().toISOString(), // Auto-confirm for demo
        user_metadata: {
          full_name: fullName,
          role,
          phone,
          company,
        },
      });

    if (authError) {
      console.error('❌ Auth creation error:', authError);
      return NextResponse.json(
        { error: `Registration failed: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No user data returned from auth creation' },
        { status: 500 }
      );
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Step 2: Create public user record
    const { error: publicUserError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
      status: 'active',
      phone: phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (publicUserError) {
      console.error('❌ Public user creation error:', publicUserError);

      // Try to clean up the auth user if public user creation failed
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('🧹 Cleaned up auth user after public user failure');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user:', cleanupError);
      }

      return NextResponse.json(
        { error: `Failed to create user profile: ${publicUserError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Public user record created successfully');

    // Step 3: Create company record if provider or client
    if ((role === 'provider' || role === 'client') && company) {
      const { error: companyError } = await supabase.from('companies').insert({
        name: company,
        type: role,
        primary_contact_id: authData.user.id,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (companyError) {
        console.error('⚠️ Company creation error:', companyError);
        // Don't fail the whole registration for company creation issues
      } else {
        console.log('✅ Company record created successfully');
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('❌ Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
