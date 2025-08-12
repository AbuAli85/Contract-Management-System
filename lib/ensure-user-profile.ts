import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

/**
 * Ensures a user profile exists in the public.profiles table.
 * If the profile does not exist, it creates one with default values.
 * This is crucial for preventing 404 errors when fetching profile data for a newly signed-up user.
 *
 * @param user The Supabase user object.
 * @returns The user's profile data.
 * @throws An error if the profile cannot be fetched or created.
 */
export async function ensureUserProfile(user: User) {
  const supabase = await createClient();

  console.log(
    `[ensureUserProfile] Checking profile for user ${user.id} (${user.email})`
  );

  // First, try to fetch the profile
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // 'PGRST116' is the code for "exact one row not found", which is expected if the profile is new.
    // For any other error, we should throw.
    console.error(
      `[ensureUserProfile] Error fetching profile for user ${user.id}:`,
      fetchError
    );
    throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
  }

  if (profile) {
    // Profile already exists, return it
    console.log(`[ensureUserProfile] Profile found for user ${user.id}`);
    return profile;
  }

  // Profile does not exist, so create it
  console.log(
    `[ensureUserProfile] No profile found for user ${user.id}. Creating one.`
  );

  const newUserProfile = {
    id: user.id,
    email: user.email || '',
    full_name:
      user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    avatar_url: user.user_metadata?.avatar_url || null,
    role: 'user', // Default role
    status: 'active', // Default status
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: createdProfile, error: createError } = await supabase
    .from('profiles')
    .insert(newUserProfile)
    .select()
    .single();

  if (createError) {
    console.error(
      `[ensureUserProfile] Error creating profile for user ${user.id}:`,
      createError
    );
    throw new Error(`Failed to create user profile: ${createError.message}`);
  }

  console.log(
    `[ensureUserProfile] Successfully created profile for user ${user.id}.`
  );
  return createdProfile;
}
