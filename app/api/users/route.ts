import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Users GET: Starting request');

    // For admin operations, use service role client
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

    // Try to get authenticated user
    let user = null;
    try {
      const supabase = await createServerClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;

      if (!user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('✅ API Users: Found user from session:', session.user.id);
          user = session.user;
        }
      }
    } catch (authError) {
      console.log('⚠️ API Users: Auth check failed:', authError);
    }

    // ✅ SECURITY FIX: Removed dangerous admin fallback
    // No authentication = NO ACCESS
    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required to access user data',
        },
        { status: 401 }
      );
    }

    // Check user permissions
    let userProfile = null;
    try {
      const { data: profileData, error: profileError } = await adminSupabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        userProfile = profileData;
      }
    } catch (error) {
      console.log('⚠️ API Users: Profiles table error:', error);
    }

    // If no profile found, try users table
    if (!userProfile) {
      try {
        const { data: userData, error: userError } = await adminSupabase
          .from('users')
          .select('role, status')
          .eq('id', user.id)
          .single();

        if (!userError && userData) {
          userProfile = userData;
        }
      } catch (error) {
        console.log('⚠️ API Users: Users table error:', error);
      }
    }

    // Check if user has admin permissions
    if (
      !userProfile ||
      !userProfile.role ||
      !['admin', 'manager'].includes(userProfile.role) ||
      !['active', 'approved'].includes(userProfile.status)
    ) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          details: 'Only active/approved admins or managers can view users',
        },
        { status: 403 }
      );
    }

    // Fetch users from profiles table
    let users: any[] = [];
    try {
      const { data: profilesData, error: profilesError } = await adminSupabase
        .from('profiles')
        .select('id, email, full_name, role, status, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (!profilesError && profilesData) {
        users = profilesData;
      } else {
        console.error('❌ API Users: Error fetching from profiles:', profilesError);
      }
    } catch (error) {
      console.log('⚠️ API Users: Profiles fetch failed, trying users table');
    }

    // If profiles table failed, try users table
    if (users.length === 0) {
      try {
        const { data: usersData, error: usersError } = await adminSupabase
          .from('users')
          .select('id, email, full_name, role, status, created_at, updated_at')
          .order('created_at', { ascending: false });

        if (!usersError && usersData) {
          users = usersData;
        } else {
          console.error('❌ API Users: Error fetching from users:', usersError);
        }
      } catch (error) {
        console.log('⚠️ API Users: Users table fetch also failed');
      }
    }

    console.log('✅ API Users: Successfully fetched users:', users.length);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: { total: users.length, page: 1, limit: users.length, totalPages: 1 },
    });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, role, status, department, position, phone, isSignup } = body;

    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    // Create admin client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user already exists
    const { data: existingUser } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user profile
    const { data: newUser, error: createError } = await adminSupabase
      .from('profiles')
      .insert({
        email,
        full_name,
        role: role || 'user',
        status: status || 'pending',
        department,
        position,
        phone,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
