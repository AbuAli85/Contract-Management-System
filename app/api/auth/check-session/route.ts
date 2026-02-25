import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Development bypass for testing (remove in production)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const bypassAuth = request.headers.get('x-bypass-auth') === 'true';
    const forceBypass = request.nextUrl.searchParams.get('bypass') === 'true';

    if (isDevelopment && (bypassAuth || forceBypass)) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: 'dev-user-123',
          email: 'dev@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_metadata: { role: 'admin' },
          role: 'admin',
          full_name: 'Development User',
        },
        session: {
          access_token: 'dev-token',
          refresh_token: 'dev-refresh',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
        warning: 'Development mode - authentication bypassed',
      });
    }

    // Create Supabase client with explicit error handling to avoid opaque 500s
    let supabase;
    try {
      supabase = await createClient();
    } catch (initError) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'Authentication service unavailable',
          hint: 'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment and restart the dev server.',
        },
        { status: 503 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'Service unavailable',
        },
        { status: 503 }
      );
    }

    // Get current session using getUser() for better security
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // Treat recoverable auth errors as unauthenticated rather than 500
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          error: 'No valid session',
        },
        { status: 200 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        { status: 200 }
      );
    }

    // Validate user data
    if (!user.id) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          error: 'Invalid user data - missing user ID',
        },
        { status: 200 }
      );
    }

    // Make email optional for development
    if (!user.email) {
      // In development, we can proceed without email
      if (process.env.NODE_ENV === 'development') {
      } else {
        return NextResponse.json(
          {
            authenticated: false,
            user: null,
            error: 'Invalid user data - missing email',
          },
          { status: 200 }
        );
      }
    }

    // Additional validation: check if user exists in database
    // Try both 'users' and 'profiles' tables for compatibility
    try {
      // First, try the 'users' table (primary location)
      let { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, email, role, full_name, status')
        .eq('id', user.id)
        .maybeSingle();

      // If not found in 'users', try 'profiles' table as fallback
      if (profileError || !userProfile) {
        const profilesResult = await supabase
          .from('profiles')
          .select('id, email, role, full_name')
          .eq('id', user.id)
          .maybeSingle();

        userProfile = profilesResult.data;
        profileError = profilesResult.error;
      }

      if (profileError) {

        // If profile not found, return basic user info from auth
        if (profileError.code === 'PGRST116') {

          // Return basic user info without database profile
          return NextResponse.json({
            authenticated: true,
            user: {
              id: user.id,
              email:
                user.email || `user-${user.id.substring(0, 8)}@example.com`,
              created_at: user.created_at,
              updated_at: user.updated_at,
              user_metadata: user.user_metadata,
              role: user.user_metadata?.role || 'user',
              full_name:
                user.user_metadata?.full_name ||
                user.email?.split('@')[0] ||
                `User ${user.id.substring(0, 8)}`,
            },
            session: {
              access_token: null, // Not available with getUser()
              refresh_token: null, // Not available with getUser()
              expires_at: null, // Not available with getUser()
            },
            warning: 'User profile not found in database, using auth metadata',
          });
        }

        // For other profile errors, still allow access in development
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json({
            authenticated: true,
            user: {
              id: user.id,
              email:
                user.email || `user-${user.id.substring(0, 8)}@example.com`,
              created_at: user.created_at,
              updated_at: user.updated_at,
              user_metadata: user.user_metadata,
              role: user.user_metadata?.role || 'user',
              full_name:
                user.user_metadata?.full_name ||
                user.email?.split('@')[0] ||
                `User ${user.id.substring(0, 8)}`,
            },
            session: {
              access_token: null, // Not available with getUser()
              refresh_token: null, // Not available with getUser()
              expires_at: null, // Not available with getUser()
            },
            warning: 'Profile validation failed, using fallback settings',
          });
        }

        return NextResponse.json(
          {
            authenticated: false,
            user: null,
            error: 'User profile not found',
          },
          { status: 200 }
        );
      }

      // Check if user status is active (if status field exists)
      if (userProfile?.status && userProfile.status !== 'active') {
        return NextResponse.json(
          {
            authenticated: false,
            user: null,
            error: `Account is ${userProfile.status}. Please contact an administrator.`,
          },
          { status: 200 }
        );
      }


      // Return user info without sensitive data
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
          user_metadata: user.user_metadata,
          role: userProfile?.role || user.user_metadata?.role || 'user',
          full_name:
            userProfile?.full_name ||
            user.user_metadata?.full_name ||
            user.email?.split('@')[0] ||
            null,
        },
        session: {
          access_token: null, // Not available with getUser()
          refresh_token: null, // Not available with getUser()
          expires_at: null, // Not available with getUser()
        },
      });
    } catch (profileError) {

      // In case of error, return auth data with fallback
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
          user_metadata: user.user_metadata,
          role: user.user_metadata?.role || 'user',
          full_name:
            user.user_metadata?.full_name || user.email?.split('@')[0] || null,
        },
        session: {
          access_token: null,
          refresh_token: null,
          expires_at: null,
        },
        warning: 'Profile query error, using auth metadata',
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: 'Unexpected authentication error',
      },
      { status: 200 }
    );
  }
}
