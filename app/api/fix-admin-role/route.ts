import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // This is a temporary admin role fix endpoint
    // Remove this after fixing the role issue

    const body = await request.json();
    const { email, userId, secret } = body;

    // Basic security check
    if (secret !== 'fix-admin-role-2025') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
    }

    if (
      email !== 'luxsess2001@gmail.com' ||
      userId !== '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170'
    ) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 403 });
    }

    // Use service role for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Update profiles table
    const { data: profileUpdate, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: 'Fahad alamri',
        role: 'admin',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Update users table
    const { data: userUpdate, error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email,
        full_name: 'Fahad alamri',
        role: 'admin',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      console.error('User update error:', userError);
    }

    // Update auth metadata using admin function
    const { data: authUpdate, error: authError } =
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          role: 'admin',
          full_name: 'Fahad alamri',
        },
      });

    if (authError) {
      console.error('Auth metadata update error:', authError);
    }

    return NextResponse.json({
      success: true,
      profile: profileUpdate,
      user: userUpdate,
      auth: authUpdate,
      errors: {
        profile: profileError?.message,
        user: userError?.message,
        auth: authError?.message,
      },
    });
  } catch (error) {
    console.error('Admin role fix error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
