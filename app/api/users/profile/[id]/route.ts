import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Use service role client to bypass all RLS and auth issues
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const targetUserId = params.id;
    console.log('📋 Profile API: Fetching profile for user ID:', targetUserId);

    // Set CORS headers for browser requests
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // First try profiles table (which has the data)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      
      // Fallback: try to get from auth users if profiles fails
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Auth fallback error:', authError);
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers });
      }

      const authUser = authData.users.find((u: any) => u.id === targetUserId);
      if (!authUser) {
        console.log('❌ User not found in auth or profiles');
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers });
      }

      // Return minimal profile from auth data
      const fallbackProfile = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        role: 'user',
        status: 'active',
        created_at: authUser.created_at,
        last_login: authUser.last_sign_in_at
      };

      console.log('✅ Profile API: Returning fallback profile');
      return NextResponse.json(fallbackProfile, { headers });
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

    console.log('✅ Profile API: Successfully fetched profile');
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
    },
  });
}