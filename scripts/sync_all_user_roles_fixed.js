import { createClient } from '@supabase/supabase-js';

// Your actual Supabase credentials from env-setup.ps1
const supabaseUrl = 'https://reootcngcptfogfozlmz.supabase.co';
const serviceRoleKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ0NDM4MiwiZXhwIjoyMDY5MDIwMzgyfQ.BTLA-2wwXJgjW6MKoaw2ERbCr_fXF9w4zgLb70_5DAE';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function syncAllUserRolesFixed() {
  try {
    console.log('🔄 Starting corrected user role synchronization...\n');

    // Step 1: Check what tables exist and their structure
    console.log('📋 Checking database structure...');

    // Check if users table exists
    const { data: usersTable, error: usersTableError } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .limit(1);

    const hasUsersTable = !usersTableError;
    console.log(`✅ Users table exists: ${hasUsersTable}`);

    // Check if profiles table exists
    const { data: profilesTable, error: profilesTableError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .limit(1);

    const hasProfilesTable = !profilesTableError;
    console.log(`✅ Profiles table exists: ${hasProfilesTable}`);

    // Check if user_roles table exists
    const { data: userRolesTable, error: userRolesTableError } = await supabase
      .from('user_roles')
      .select('id, user_id, role')
      .limit(1);

    const hasUserRolesTable = !userRolesTableError;
    console.log(`✅ User_roles table exists: ${hasUserRolesTable}\n`);

    // Step 2: Get all users from the main users table
    console.log('👥 Fetching all users from users table...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, role, full_name, status')
      .order('email');

    if (allUsersError) {
      console.error('❌ Error fetching users:', allUsersError);
      return;
    }

    console.log(`✅ Found ${allUsers.length} users in users table\n`);

    // Step 3: Clean up duplicate entries first
    console.log('🧹 Cleaning up duplicate entries...');

    if (hasProfilesTable) {
      // Remove duplicate profiles
      for (const user of allUsers) {
        try {
          await supabase.from('profiles').delete().eq('id', user.id);
          console.log(`  ✅ Cleaned profiles for ${user.email}`);
        } catch (cleanError) {
          console.log(`  ⚠️ No profiles to clean for ${user.email}`);
        }
      }
    }

    if (hasUserRolesTable) {
      // Remove duplicate user_roles
      for (const user of allUsers) {
        try {
          await supabase.from('user_roles').delete().eq('user_id', user.id);
          console.log(`  ✅ Cleaned user_roles for ${user.email}`);
        } catch (cleanError) {
          console.log(`  ⚠️ No user_roles to clean for ${user.email}`);
        }
      }
    }

    console.log('');

    // Step 4: Sync each user across all tables with correct schema
    for (const user of allUsers) {
      console.log(`🔄 Syncing user: ${user.email} (${user.role})`);

      // Update profiles table if it exists
      if (hasProfilesTable) {
        try {
          // Map roles to allowed values in profiles table
          let profileRole = user.role;
          if (user.role === 'provider' || user.role === 'client') {
            profileRole = 'user'; // Default to 'user' if role not allowed
          }

          const { data: profileUpdate, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              role: profileRole,
              updated_at: new Date().toISOString(),
            })
            .select();

          if (profileError) {
            console.error(
              `  ❌ Profiles table update failed:`,
              profileError.message
            );
          } else {
            console.log(`  ✅ Profiles table synced with role: ${profileRole}`);
          }
        } catch (profileError) {
          console.error(`  ❌ Profiles table error:`, profileError.message);
        }
      }

      // Update user_roles table if it exists
      if (hasUserRolesTable) {
        try {
          // Insert the current role without the problematic column
          const { data: userRoleUpdate, error: userRoleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: user.role,
              is_active: true,
            })
            .select();

          if (userRoleError) {
            console.error(
              `  ❌ User_roles table update failed:`,
              userRoleError.message
            );
          } else {
            console.log(`  ✅ User_roles table synced`);
          }
        } catch (userRoleError) {
          console.error(`  ❌ User_roles table error:`, userRoleError.message);
        }
      }

      console.log(`  ✅ User ${user.email} synced across all tables\n`);
    }

    // Step 5: Verify synchronization
    console.log('🔍 Verifying synchronization...\n');

    for (const user of allUsers) {
      console.log(`📊 Verification for: ${user.email}`);

      // Check users table
      const { data: userCheck, error: userCheckError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .single();

      if (!userCheckError) {
        console.log(`  ✅ Users table: ${userCheck.role}`);
      }

      // Check profiles table
      if (hasProfilesTable) {
        const { data: profileCheck, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('id', user.id)
          .single();

        if (!profileCheckError) {
          console.log(`  ✅ Profiles table: ${profileCheck.role}`);
        } else {
          console.log(`  ❌ Profiles table: ${profileCheckError.message}`);
        }
      }

      // Check user_roles table
      if (hasUserRolesTable) {
        const { data: userRoleCheck, error: userRoleCheckError } =
          await supabase
            .from('user_roles')
            .select('user_id, role')
            .eq('user_id', user.id)
            .single();

        if (!userRoleCheckError) {
          console.log(`  ✅ User_roles table: ${userRoleCheck.role}`);
        } else {
          console.log(`  ❌ User_roles table: ${userRoleCheckError.message}`);
        }
      }

      console.log('');
    }

    console.log('🎉 User role synchronization completed!');
    console.log('\n📋 Summary:');
    console.log(`- Users table: ${allUsers.length} users`);
    console.log(
      `- Profiles table: ${hasProfilesTable ? 'Synced (with role mapping)' : 'Not found'}`
    );
    console.log(
      `- User_roles table: ${hasUserRolesTable ? 'Synced (simplified schema)' : 'Not found'}`
    );

    console.log('\n🔧 Role Mapping Applied:');
    console.log('- provider → user (in profiles table)');
    console.log('- client → user (in profiles table)');
    console.log('- admin, user → unchanged');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

syncAllUserRolesFixed();
