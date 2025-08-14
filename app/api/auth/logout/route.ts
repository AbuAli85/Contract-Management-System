import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearAuthCookies } from '@/lib/actions/cookie-actions';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase signout error:', error);
    }

    // Create response
    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Clear auth cookies
    await clearAuthCookies(response);

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, try to clear cookies
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    try {
      await clearAuthCookies(response);
    } catch (cookieError) {
      console.error('Cookie cleanup error:', cookieError);
    }

    return response;
  }
}
