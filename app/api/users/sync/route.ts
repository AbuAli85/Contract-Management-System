import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserProfile } from '@/lib/ensure-user-profile';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'No authenticated user found.' }, { status: 401 });
    }

    // The core logic: ensure the user profile exists.
    const profile = await ensureUserProfile(user);

    return NextResponse.json({ success: true, message: 'User profile is synchronized.', profile });
  } catch (error) {
    console.error('[API /users/sync] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
