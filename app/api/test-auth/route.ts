import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to create Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// Helper function to get user from request headers
async function getUserFromRequest(request: NextRequest) {
  const supabase = createSupabaseClient();
  
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      return { user, error };
    } catch (error) {
      return { user: null, error: 'Invalid token' };
    }
  }
  
  // Fallback: try to get from cookie header
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const authToken = cookies['sb-ekdjxzhujettocosgzql-auth-token'];
    if (authToken) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(authToken);
        return { user, error };
      } catch (error) {
        return { user: null, error: 'Invalid cookie token' };
      }
    }
  }
  
  return { user: null, error: 'No auth token found' };
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test Auth API - Starting request');
    
    // Log all headers for debugging
    const headersList = request.headers;
    console.log('🔍 Request headers:', Object.fromEntries(headersList.entries()));
    
    // Get user from request
    const { user, error: authError } = await getUserFromRequest(request);
    
    console.log('🔍 Auth check result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError
    });
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError || 'No user found');
      return NextResponse.json({ 
        error: 'Unauthorized',
        authError: authError,
        hasUser: !!user
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Error in test auth API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 