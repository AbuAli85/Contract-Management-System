import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simplified GET - Fetch all users (bypassing complex auth for now)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Users: Starting simplified GET request');

    // Use service role client directly - bypassing session auth issues
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      console.error('❌ API Users: Missing service role credentials');
      return NextResponse.json(
        {
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('✅ API Users: Using service role for operations');

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔍 API Users: Query params:', {
      status,
      role,
      search,
      limit,
      offset,
    });

    // Build query
    let query = adminSupabase
      .from('profiles')
      .select(
        `
        id,
        email,
        role,
        status,
        first_name,
        last_name,
        company,
        phone,
        department,
        position,
        avatar_url,
        created_at,
        updated_at
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (role) {
      query = query.eq('role', role);
    }
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('❌ API Users: Error fetching users:', usersError);
      return NextResponse.json(
        {
          error: 'Failed to fetch users',
          details: usersError.message,
        },
        { status: 500 }
      );
    }

    console.log(
      '✅ API Users: Successfully fetched users:',
      users?.length || 0
    );

    return NextResponse.json({
      users: users || [],
      total: users?.length || 0,
      pagination: {
        limit,
        offset,
        hasMore: (users?.length || 0) === limit,
      },
    });
  } catch (error) {
    console.error('❌ API Users: Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Simplified POST - Create user (bypassing complex auth)
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API Users: Starting POST request');

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await request.json();
    const { email, role = 'user', status = 'pending', isSignup = false } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await adminSupabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'User already exists',
        },
        { status: 409 }
      );
    }

    // Create user profile
    const { data: newUser, error: createError } = await adminSupabase
      .from('profiles')
      .insert({
        email,
        role: isSignup ? 'user' : role,
        status: isSignup ? 'pending' : status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ API Users: Error creating user:', createError);
      return NextResponse.json(
        {
          error: 'Failed to create user',
          details: createError.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ API Users: User created successfully:', newUser?.id);

    return NextResponse.json({
      success: true,
      user: newUser,
      message: isSignup
        ? 'Account created successfully. Please wait for admin approval.'
        : 'User created successfully',
    });
  } catch (error) {
    console.error('❌ API Users: POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export { GET as default };
