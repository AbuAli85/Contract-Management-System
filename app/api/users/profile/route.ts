import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export const GET = withRBAC(
  'profile:read:own',
  async (request: NextRequest) => {
    try {
      console.log('🔍 User Profile API: Starting request...');

      const supabase = await createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log('❌ User Profile API: No authenticated user');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      console.log('✅ User Profile API: User authenticated:', user.id);

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log(
          '⚠️ User Profile API: Profile not found, creating default profile'
        );

        // Create a default profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.email?.split('@')[0] ||
              'User',
            role: user.user_metadata?.role || 'user',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error(
            '❌ User Profile API: Error creating profile:',
            createError
          );
          return NextResponse.json(
            {
              error: 'Failed to create user profile',
              details: createError.message,
            },
            { status: 500 }
          );
        }

        console.log('✅ User Profile API: Created new profile');
        return NextResponse.json(newProfile);
      }

      console.log('✅ User Profile API: Profile found');
      return NextResponse.json(profile);
    } catch (error) {
      console.error('❌ User Profile API: Unexpected error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);

export const PUT = withRBAC(
  'profile:update:own',
  async (request: NextRequest) => {
    try {
      console.log('🔍 User Profile API: Starting PUT request...');

      const supabase = await createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log('❌ User Profile API: No authenticated user');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { full_name, avatar_url, role } = body;

      // Prepare update data
      const updateData: any = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
      if (role !== undefined) updateData.role = role;

      console.log('🔍 User Profile API: Updating profile for user:', user.id);

      // Update profile in profiles table
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error(
          '❌ User Profile API: Error updating profile:',
          updateError
        );
        return NextResponse.json(
          {
            error: 'Failed to update profile',
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      console.log('✅ User Profile API: Profile updated successfully');
      return NextResponse.json(updatedProfile);
    } catch (error) {
      console.error('❌ User Profile API: Unexpected error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);
