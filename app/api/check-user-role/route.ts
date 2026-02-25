import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const roleInfo: any = {
      userId: user.id,
      userEmail: user.email,
      sources: {
        users: null,
        profiles: null,
        app_users: null,
        auth: null,
      },
      finalRole: null,
      errors: [],
    };

    // Check users table
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .eq('id', user.id)
        .single();

      if (usersError) {
        roleInfo.errors.push(`Users table error: ${usersError.message}`);
      } else {
        roleInfo.sources.users = usersData;
      }
    } catch (error) {
      roleInfo.errors.push(`Users table exception: ${error}`);
    }

    // Check profiles table
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role, created_at')
        .eq('id', user.id)
        .single();

      if (profilesError) {
        roleInfo.errors.push(`Profiles table error: ${profilesError.message}`);
      } else {
        roleInfo.sources.profiles = profilesData;
      }
    } catch (error) {
      roleInfo.errors.push(`Profiles table exception: ${error}`);
    }

    // Check app_users table
    try {
      const { data: appUsersData, error: appUsersError } = await supabase
        .from('app_users')
        .select('id, email, role, created_at')
        .eq('id', user.id)
        .single();

      if (appUsersError) {
        roleInfo.errors.push(`App_users table error: ${appUsersError.message}`);
      } else {
        roleInfo.sources.app_users = appUsersData;
      }
    } catch (error) {
      roleInfo.errors.push(`App_users table exception: ${error}`);
    }

    // Determine final role (priority: users > profiles > app_users > default)
    if (roleInfo.sources.users?.role) {
      roleInfo.finalRole = roleInfo.sources.users.role;
    } else if (roleInfo.sources.profiles?.role) {
      roleInfo.finalRole = roleInfo.sources.profiles.role;
    } else if (roleInfo.sources.app_users?.role) {
      roleInfo.finalRole = roleInfo.sources.app_users.role;
    } else {
      roleInfo.finalRole = 'user'; // Default fallback
    }


    return NextResponse.json({
      success: true,
      roleInfo,
      summary: {
        hasRoleInUsers: !!roleInfo.sources.users?.role,
        hasRoleInProfiles: !!roleInfo.sources.profiles?.role,
        hasRoleInAppUsers: !!roleInfo.sources.app_users?.role,
        finalRole: roleInfo.finalRole,
        totalErrors: roleInfo.errors.length,
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: 'Role check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
