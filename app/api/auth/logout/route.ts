import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearAuthCookies } from '@/lib/actions/cookie-actions';

export async function POST(_request: NextRequest) {
  try {
    const supabase = createClient();

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
    }

    // Create response
    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Clear auth cookies
    await clearAuthCookies(response);

    return response;
  } catch (error) {

    // Even if there's an error, try to clear cookies
    const response = NextResponse.json({ message: 'Logged out successfully' });

    try {
      await clearAuthCookies(response);
    } catch (cookieError) {
    }

    return response;
  }
}
