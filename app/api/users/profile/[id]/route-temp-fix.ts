import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Use service role client to bypass RLS issues
    const supabase = createClient();
    
    const targetUserId = params.id;
    console.log('Fetching profile for user ID:', targetUserId);

    // First try profiles table (which has the data)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      
      // Fallback: try to get from auth users if profiles fails
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const authUser = authData.users.find(u => u.id === targetUserId);
      if (!authUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

      return NextResponse.json(fallbackProfile);
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

    console.log('Successfully fetched profile:', userProfile);
    return NextResponse.json(userProfile);

  } catch (error) {
    console.error('Unexpected error in profile route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
