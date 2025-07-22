import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper function to get user from request headers
async function getUserFromRequest(request: NextRequest) {
  const supabase = await createClient();
  
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
  
  // Try to get session from cookies
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('🔍 Session error:', error)
      return { user: null, error: error.message }
    }
    
    if (session?.user) {
      console.log('🔍 Found user in session:', session.user.email)
      return { user: session.user, error: null }
    }
    
    console.log('🔍 No session found')
    return { user: null, error: 'No session found' }
  } catch (error) {
    console.log('🔍 Error getting session:', error)
    return { user: null, error: 'Session error' }
  }
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
        hasUser: !!user,
        message: 'No active session found. Please log in first.'
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('Error in test auth API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 