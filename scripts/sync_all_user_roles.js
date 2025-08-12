import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function syncAllUserRoles() {
  try {
    console.log('🔄 Starting comprehensive user role synchronization...\n');
    
    // Step 1: Check what tables exist
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
    
    // Step 3: Sync each user across all tables
    for (const user of allUsers) {
      console.log(`🔄 Syncing user: ${user.email} (${user.role})`);
      
      // Update profiles table if it exists
      if (hasProfilesTable) {
        try {
          const { data: profileUpdate, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              role: user.role,
              status: user.status || 'active',
              updated_at: new Date().toISOString()
            })
            .select();
          
          if (profileError) {
            console.error(`  ❌ Profiles table update failed:`, profileError.message);
          } else {
            console.log(`  ✅ Profiles table synced`);
          }
        } catch (profileError) {
          console.error(`  ❌ Profiles table error:`, profileError.message);
        }
      }
      
      // Update user_roles table if it exists
      if (hasUserRolesTable) {
        try {
          // First, delete any existing roles for this user
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', user.id);
          
          // Then insert the current role
          const { data: userRoleUpdate, error: userRoleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: user.role,
              is_active: true,
              assigned_at: new Date().toISOString()
            })
            .select();
          
          if (userRoleError) {
            console.error(`  ❌ User_roles table update failed:`, userRoleError.message);
          } else {
            console.log(`  ✅ User_roles table synced`);
          }
        } catch (userRoleError) {
          console.error(`  ❌ User_roles table error:`, userRoleError.message);
        }
      }
      
      console.log(`  ✅ User ${user.email} synced across all tables\n`);
    }
    
    // Step 4: Verify synchronization
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
        const { data: userRoleCheck, error: userRoleCheckError } = await supabase
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
    console.log(`- Profiles table: ${hasProfilesTable ? 'Synced' : 'Not found'}`);
    console.log(`- User_roles table: ${hasUserRolesTable ? 'Synced' : 'Not found'}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

syncAllUserRoles();
