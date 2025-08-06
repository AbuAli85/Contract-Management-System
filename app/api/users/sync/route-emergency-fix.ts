import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserProfile } from '@/lib/ensure-user-profile';

export async function POST() {
  try {
    console.log('[API /users/sync] Starting user sync...');
    
    const supabase = await createClient();
    
    // Enhanced authentication check with better error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[API /users/sync] Auth error:', authError);
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication failed: ' + authError.message 
      }, { status: 401 });
    }

    if (!user) {
      console.warn('[API /users/sync] No authenticated user found');
      return NextResponse.json({ 
        success: false, 
        message: 'No authenticated user found. Please log in again.' 
      }, { status: 401 });
    }

    console.log('[API /users/sync] User authenticated:', user.id);

    // The core logic: ensure the user profile exists with error handling
    let profile;
    try {
      profile = await ensureUserProfile(user);
      console.log('[API /users/sync] Profile sync successful');
    } catch (profileError) {
      console.error('[API /users/sync] Profile sync error:', profileError);
      // Return success anyway to prevent blocking
      return NextResponse.json({ 
        success: true, 
        message: 'User profile sync completed with warnings.', 
        profile: null,
        warning: profileError instanceof Error ? profileError.message : 'Profile sync warning'
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User profile is synchronized.', 
      profile 
    });
    
  } catch (error) {
    console.error('[API /users/sync] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    
    // Return a more graceful error that doesn't break the app
    return NextResponse.json({ 
      success: false, 
      message: 'Sync temporarily unavailable. App will continue to function.',
      error: errorMessage 
    }, { status: 500 });
  }
}
