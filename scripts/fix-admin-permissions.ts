#!/usr/bin/env tsx
/**
 * Quick Fix for Admin Permissions
 *
 * This script specifically fixes admin user permissions by:
 * 1. Finding all admin users
 * 2. Ensuring admin role exists with all permissions
 * 3. Assigning admin role to admin users
 * 4. Refreshing permission cache
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n🔧 Admin Permissions Quick Fix\n');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Check table structure
    console.log('1. Checking table structure...');
    const { data: rbacRoles, error: rbacError } = await supabase
      .from('rbac_roles')
      .select('id')
      .limit(1);

    const tablePrefix = !rbacError ? 'rbac' : 'standard';
    const rolesTable = tablePrefix === 'rbac' ? 'rbac_roles' : 'roles';
    const permsTable =
      tablePrefix === 'rbac' ? 'rbac_permissions' : 'permissions';
    const joinTable =
      tablePrefix === 'rbac' ? 'rbac_role_permissions' : 'role_permissions';
    const assignmentsTable =
      tablePrefix === 'rbac' ? 'rbac_user_role_assignments' : 'user_roles';

    console.log(`✅ Using ${tablePrefix} tables\n`);

    // 2. Get or create admin role
    console.log('2. Ensuring admin role exists...');
    let { data: adminRole, error: adminError } = await supabase
      .from(rolesTable)
      .select('id, name')
      .eq('name', 'admin')
      .single();

    if (adminError || !adminRole) {
      console.log('   Creating admin role...');
      const { data: newRole, error: createError } = await supabase
        .from(rolesTable)
        .insert({
          name: 'admin',
          category: 'admin',
          description: 'Full system access',
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create admin role:', createError);
        process.exit(1);
      }
      adminRole = newRole;
    }

    if (!adminRole) {
      console.error('❌ Failed to get admin role');
      process.exit(1);
    }

    console.log(`✅ Admin role exists (ID: ${adminRole.id})\n`);

    // 3. Ensure key permissions exist and are assigned to admin
    console.log('3. Ensuring critical permissions are assigned to admin...');
    const criticalPermissions = [
      {
        resource: 'contract',
        action: 'read',
        scope: 'own',
        name: 'contract:read:own',
      },
      {
        resource: 'contract',
        action: 'create',
        scope: 'own',
        name: 'contract:create:own',
      },
      {
        resource: 'contract',
        action: 'update',
        scope: 'own',
        name: 'contract:update:own',
      },
      {
        resource: 'contract',
        action: 'delete',
        scope: 'own',
        name: 'contract:delete:own',
      },
      {
        resource: 'contract',
        action: 'read',
        scope: 'all',
        name: 'contract:read:all',
      },
      {
        resource: 'party',
        action: 'read',
        scope: 'own',
        name: 'party:read:own',
      },
      {
        resource: 'party',
        action: 'create',
        scope: 'own',
        name: 'party:create:own',
      },
      {
        resource: 'promoter',
        action: 'read',
        scope: 'own',
        name: 'promoter:read:own',
      },
      { resource: 'user', action: 'read', scope: 'own', name: 'user:read:own' },
      {
        resource: 'profile',
        action: 'read',
        scope: 'own',
        name: 'profile:read:own',
      },
      {
        resource: 'profile',
        action: 'update',
        scope: 'own',
        name: 'profile:update:own',
      },
      {
        resource: 'dashboard',
        action: 'view',
        scope: 'own',
        name: 'dashboard:view:own',
      },
    ];

    let assignedCount = 0;
    for (const perm of criticalPermissions) {
      // Upsert permission
      const { data: permission, error: permError } = await supabase
        .from(permsTable)
        .upsert(perm, { onConflict: 'name' })
        .select()
        .single();

      if (permError || !permission) {
        console.error(`   ⚠️ Failed to create permission ${perm.name}`);
        continue;
      }

      // Assign to admin role
      const { error: assignError } = await supabase
        .from(joinTable)
        .upsert(
          { role_id: adminRole.id, permission_id: permission.id },
          { onConflict: 'role_id,permission_id' }
        );

      if (!assignError) {
        assignedCount++;
      }
    }
    console.log(
      `✅ Assigned ${assignedCount} critical permissions to admin role\n`
    );

    // 4. Find and assign admin role to admin users
    console.log('4. Finding admin users...');
    const { data: adminUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'admin');

    if (usersError || !adminUsers || adminUsers.length === 0) {
      console.log('⚠️ No admin users found with role=admin in users table\n');

      // Try to find first user and make them admin
      console.log('5. Looking for first user to promote to admin...');
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id, email, role')
        .limit(1);

      if (!allUsersError && allUsers && allUsers.length > 0) {
        const firstUser = allUsers[0];
        if (!firstUser) {
          console.log('   ⚠️ No user data available');
        } else {
          console.log(`   Found user: ${firstUser.email}`);
          console.log(`   Promoting to admin...`);

          // Update user role
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', firstUser.id);

          if (updateError) {
            console.error('   ❌ Failed to update user role:', updateError);
          } else {
            console.log('   ✅ User promoted to admin in users table');

            // Assign RBAC role
            const { error: assignError } = await supabase
              .from(assignmentsTable)
              .upsert(
                {
                  user_id: firstUser.id,
                  role_id: adminRole.id,
                  is_active: true,
                },
                { onConflict: 'user_id,role_id' }
              );

            if (assignError) {
              console.error('   ❌ Failed to assign RBAC role:', assignError);
            } else {
              console.log('   ✅ RBAC admin role assigned');
            }
          }
        }
      } else {
        console.log('   ⚠️ No users found in database');
      }
    } else {
      console.log(`   Found ${adminUsers.length} admin user(s)\n`);

      // 5. Assign RBAC admin role to each admin user
      console.log('5. Assigning RBAC admin role to admin users...');
      for (const user of adminUsers) {
        const { error: assignError } = await supabase
          .from(assignmentsTable)
          .upsert(
            {
              user_id: user.id,
              role_id: adminRole.id,
              is_active: true,
            },
            { onConflict: 'user_id,role_id' }
          );

        if (assignError) {
          console.error(`   ❌ Failed for ${user.email}:`, assignError.message);
        } else {
          console.log(`   ✅ Assigned to: ${user.email}`);
        }
      }
    }

    // 6. Refresh materialized view if using rbac_ tables
    if (tablePrefix === 'rbac') {
      console.log('\n6. Refreshing permission cache...');
      try {
        const { error: refreshError } = await supabase.rpc(
          'rbac_refresh_user_permissions_mv'
        );
        if (refreshError) {
          console.error(
            '   ⚠️ Failed to refresh materialized view:',
            refreshError.message
          );
        } else {
          console.log('   ✅ Permission cache refreshed');
        }
      } catch (error) {
        console.error('   ⚠️ Exception refreshing cache:', error);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Admin permissions fix completed!\n');
    console.log('📋 Next steps:');
    console.log('1. Clear your browser cache and cookies');
    console.log('2. Log out and log back in');
    console.log('3. Test accessing /api/contracts and /api/parties');
    console.log('4. If issues persist, run: npm run diagnose:auth\n');
    console.log('='.repeat(80) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fix script failed:', error);
    console.error('\nPlease check:');
    console.error('1. Supabase credentials are correct');
    console.error('2. Database migrations have been run');
    console.error('3. RBAC tables exist in the database\n');
    process.exit(1);
  }
}

main();
