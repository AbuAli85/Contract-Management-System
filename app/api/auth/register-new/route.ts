import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();

    const { email, password, fullName, role, phone, company } = body;

    console.log('🔐 Registration API - Starting for:', email, role);

    // SECURITY FIX: Comprehensive input validation
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
        },
        { status: 400 }
      );
    }

    // Full name validation
    if (fullName.length < 2 || fullName.length > 100) {
      return NextResponse.json(
        { error: 'Full name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // SECURITY FIX: Restrict allowed roles (remove admin from client registration)
    const validRoles = ['provider', 'client', 'user'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // SECURITY FIX: Use correct property name
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
        { error: 'Registration failed' }, // SECURITY FIX: Generic error message
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      );
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Step 2: Create public user record with PENDING status for approval
    const { error: publicUserError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
      status: 'pending', // 🔒 SECURITY: All new users require admin approval
      phone: phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (publicUserError) {
      console.error('❌ Public user creation error:', publicUserError);

      // Try to clean up the auth user if public user creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('🧹 Cleaned up auth user after public user failure');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user:', cleanupError);
      }

      return NextResponse.json(
        { error: 'Registration failed' }, // SECURITY FIX: Generic error message
        { status: 500 }
      );
    }

    console.log('✅ Public user record created successfully');

    // Step 3: Create organization record if provider or client
    if ((role === 'provider' || role === 'client') && company) {
      const { error: companyError } = await supabaseAdmin.from('organizations').insert({
        name: company,
        type: role,
        primary_contact_id: authData.user.id,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (companyError) {
        console.error('⚠️ Organization creation error:', companyError);
        // Don't fail the whole registration for organization creation issues
      } else {
        console.log('✅ Organization record created successfully');
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        status: 'pending'
      },
      message: 'Registration submitted successfully. Your account is pending admin approval.',
      requiresApproval: true
    });
  } catch (error) {
    console.error('❌ Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
