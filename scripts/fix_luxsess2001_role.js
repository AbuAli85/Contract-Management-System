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
    persistSession: false,
  },
});

async function fixLuxsess2001Role() {
  try {
    console.log('🔧 Fixing role for luxsess2001@gmail.com...');

    const targetUserId = '947d9e41-8d7b-4604-978b-4cb2819b8794';
    const targetEmail = 'luxsess2001@gmail.com';

    console.log(`Target User ID: ${targetUserId}`);
    console.log(`Target Email: ${targetEmail}`);

    // Step 1: Update users table with full admin permissions
    console.log('📝 Updating users table with admin role and permissions...');
    const { data: userUpdate, error: userError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        status: 'active',
        permissions: [
          'users.view', 'users.create', 'users.edit', 'users.delete', 'users.bulk',
          'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete', 'contracts.approve',
          'dashboard.view', 'analytics.view', 'reports.generate',
          'settings.view', 'settings.edit', 'logs.view', 'backup.create'
        ],
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId)
      .eq('email', targetEmail)
      .select();

    if (userError) {
      console.error('❌ Error updating users table:', userError);
    } else {
      console.log('✅ Users table updated:', userUpdate);
    }

    // Step 2: Update profiles table
    console.log('📝 Updating profiles table...');
    const { data: profileUpdate, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: targetUserId,
        email: targetEmail,
        full_name: 'Fahad alamri',
        role: 'admin',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .select();

    if (profileError) {
      console.error('❌ Error updating profiles table:', profileError);
    } else {
      console.log('✅ Profiles table updated:', profileUpdate);
    }

    // Step 3: Update user_roles table if it exists
    console.log('📝 Updating user_roles table...');
    try {
      const { data: userRoleUpdate, error: userRoleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: targetUserId,
          role: 'admin',
          assigned_at: new Date().toISOString(),
          assigned_by: targetUserId,
        })
        .select();

      if (userRoleError) {
        console.error('❌ Error updating user_roles table:', userRoleError);
      } else {
        console.log('✅ User_roles table updated:', userRoleUpdate);
      }
    } catch (error) {
      console.log('⚠️ user_roles table might not exist, skipping...');
    }

    // Step 4: Update auth.users metadata
    console.log('📝 Updating auth user metadata...');
    try {
      const { error: authError } = await supabase.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          role: 'admin',
          status: 'active',
          full_name: 'Fahad alamri'
        }
      });

      if (authError) {
        console.error('❌ Error updating auth metadata:', authError);
      } else {
        console.log('✅ Auth user metadata updated');
      }
    } catch (error) {
      console.log('⚠️ Could not update auth metadata:', error.message);
    }

    // Step 5: Verify the change
    console.log('🔍 Verifying the change...');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('id, email, role, status, permissions')
      .eq('id', targetUserId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying user:', verifyError);
    } else {
      console.log('✅ Verification result:', verifyUser);
      if (verifyUser.role === 'admin') {
        console.log('🎉 SUCCESS: User role has been updated to admin!');
        console.log('🔑 Admin permissions granted:', verifyUser.permissions);
      } else {
        console.log(
          '⚠️ WARNING: User role is still not admin:',
          verifyUser.role
        );
      }
    }

    // Step 6: Test admin access
    console.log('🧪 Testing admin access...');
    try {
      const { data: adminUsers, error: adminError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('role', 'admin');

      if (adminError) {
        console.error('❌ Error testing admin access:', adminError);
      } else {
        console.log('✅ Admin access test successful. Found admin users:', adminUsers);
      }
    } catch (error) {
      console.error('❌ Admin access test failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixLuxsess2001Role();
