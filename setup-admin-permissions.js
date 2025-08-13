const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdminPermissions() {
  try {
    console.log('🔧 Setting up admin RBAC permissions...');

    // Define admin permissions
    const adminPermissions = [
      'user:view:all',
      'user:create:all', 
      'user:edit:all',
      'user:delete:all',
      'user:approve:all',
      'role:assign:all',
      'role:revoke:all',
      'system:backup:all',
      'system:maintenance:all',
      'audit:read:all',
      'notification:manage:all',
      'workflow:approve:all',
      'permission:manage:all'
    ];

    // Get all admin users
    const { data: adminUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'admin');

    if (usersError) {
      console.error('❌ Error fetching admin users:', usersError);
      return;
    }

    console.log(`👥 Found ${adminUsers.length} admin users`);

    for (const admin of adminUsers) {
      console.log(`🔐 Setting up permissions for: ${admin.email}`);

      // Check if user_permissions table exists
      const { data: existingPermissions, error: checkError } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', admin.id)
        .limit(1);

      if (checkError && checkError.code === '42P01') {
        console.log('📋 user_permissions table does not exist, creating permissions via user metadata...');
        
        // Update user metadata with permissions if table doesn't exist
        const { error: updateError } = await supabase.auth.admin.updateUserById(admin.id, {
          user_metadata: {
            permissions: adminPermissions,
            role: 'admin',
            rbac_permissions: adminPermissions
          }
        });

        if (updateError) {
          console.error(`❌ Failed to update metadata for ${admin.email}:`, updateError);
        } else {
          console.log(`✅ Updated metadata permissions for ${admin.email}`);
        }
        continue;
      }

      // If table exists, insert permissions
      if (!checkError) {
        // Delete existing permissions for this user
        await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', admin.id);

        // Insert new permissions
        const permissionRecords = adminPermissions.map(permission => ({
          user_id: admin.id,
          permission: permission,
          granted_by: admin.id, // Self-granted for bootstrap
          granted_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(permissionRecords);

        if (insertError) {
          console.error(`❌ Failed to insert permissions for ${admin.email}:`, insertError);
        } else {
          console.log(`✅ Inserted ${adminPermissions.length} permissions for ${admin.email}`);
        }
      }
    }

    console.log('\n🎉 Admin RBAC permissions setup complete!');
    console.log('📋 Admins now have:');
    adminPermissions.forEach(permission => {
      console.log(`  • ${permission}`);
    });

  } catch (error) {
    console.error('❌ Error setting up admin permissions:', error);
  }
}

setupAdminPermissions();
