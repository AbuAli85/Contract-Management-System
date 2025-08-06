import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createClient();
    
    console.log('📋 Profile API: Fetching profile for user ID:', targetUserId);

    // Set CORS headers for browser requests
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Try to get the profile from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      
      if (profileError.code === 'PGRST116') {
        // Profile not found
        return NextResponse.json({ 
          error: 'Profile not found',
          message: 'User profile does not exist',
          code: 'PROFILE_NOT_FOUND'
        }, { status: 404, headers });
      }
      
      // Other database error
      return NextResponse.json({ 
        error: 'Database error',
        message: profileError.message 
      }, { status: 500, headers });
    }

    if (!profile) {
      console.log('❌ Profile not found');
      return NextResponse.json({ 
        error: 'Profile not found',
        message: 'User profile does not exist' 
      }, { status: 404, headers });
    }

    // Success - return profile data
    const userProfile = {
      id: profile.id,
      email: profile.email || '',
      full_name: profile.full_name || '',
      avatar_url: profile.avatar_url,
      role: profile.role || 'user',
      status: profile.status || 'active',
      created_at: profile.created_at,
      last_login: profile.last_login,
      updated_at: profile.updated_at
    };

    console.log('✅ Profile API: Successfully fetched profile for', profile.email);
    return NextResponse.json(userProfile, { headers });

  } catch (error) {
    console.error('💥 Profile API unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}