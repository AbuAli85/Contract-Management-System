import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { formatAuthError } from '@/lib/actions/cookie-actions';

export async function POST(request: NextRequest) {
  try {
    const { first_name, last_name, email, password, role } = await request.json();

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { error: { message: 'All fields are required' } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: { message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          role: role || 'user',
        },
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: { message: 'User creation failed' } },
        { status: 500 }
      );
    }

    // Create profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        first_name,
        last_name,
        role: role || 'user',
        status: 'pending', // Requires admin approval
      });

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      // For now, just log the error
      console.error('Profile creation failed:', profileError);
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name,
        last_name,
        role: role || 'user',
        status: 'pending',
      },
      message: 'User registered successfully. Please wait for admin approval.',
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: formatAuthError(error) },
      { status: 500 }
    );
  }
}
