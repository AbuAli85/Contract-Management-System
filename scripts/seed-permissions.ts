#!/usr/bin/env tsx
/**
 * Permission Seeding Script
 *
 * This script seeds the database with:
 * 1. Default roles (admin, manager, user, viewer)
 * 2. Essential permissions for contract management
 * 3. Role-permission assignments
 * 4. Admin user role assignment
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

// Define roles
const roles = [
  {
    name: 'admin',
    category: 'admin',
    description: 'Full system access with all permissions',
  },
  {
    name: 'manager',
    category: 'admin',
    description: 'Manager with elevated permissions',
  },
  {
    name: 'user',
    category: 'client',
    description: 'Standard user with basic permissions',
  },
  {
    name: 'viewer',
    category: 'client',
    description: 'Read-only access',
  },
];

// Define comprehensive permissions
const permissions = [
  // Contract permissions
  {
    resource: 'contract',
    action: 'create',
    scope: 'own',
    name: 'contract:create:own',
    description: 'Create own contracts',
  },
  {
    resource: 'contract',
    action: 'read',
    scope: 'own',
    name: 'contract:read:own',
    description: 'Read own contracts',
  },
  {
    resource: 'contract',
    action: 'update',
    scope: 'own',
    name: 'contract:update:own',
    description: 'Update own contracts',
  },
  {
    resource: 'contract',
    action: 'delete',
    scope: 'own',
    name: 'contract:delete:own',
    description: 'Delete own contracts',
  },
  {
    resource: 'contract',
    action: 'generate',
    scope: 'own',
    name: 'contract:generate:own',
    description: 'Generate contracts',
  },
  {
    resource: 'contract',
    action: 'export',
    scope: 'own',
    name: 'contract:export:own',
    description: 'Export contracts',
  },
  {
    resource: 'contract',
    action: 'message',
    scope: 'own',
    name: 'contract:message:own',
    description: 'Message about contracts',
  },
  {
    resource: 'contract',
    action: 'read',
    scope: 'all',
    name: 'contract:read:all',
    description: 'Read all contracts',
  },
  {
    resource: 'contract',
    action: 'update',
    scope: 'all',
    name: 'contract:update:all',
    description: 'Update all contracts',
  },
  {
    resource: 'contract',
    action: 'delete',
    scope: 'all',
    name: 'contract:delete:all',
    description: 'Delete all contracts',
  },

  // Party permissions
  {
    resource: 'party',
    action: 'create',
    scope: 'own',
    name: 'party:create:own',
    description: 'Create parties',
  },
  {
    resource: 'party',
    action: 'read',
    scope: 'own',
    name: 'party:read:own',
    description: 'Read own parties',
  },
  {
    resource: 'party',
    action: 'update',
    scope: 'own',
    name: 'party:update:own',
    description: 'Update own parties',
  },
  {
    resource: 'party',
    action: 'delete',
    scope: 'own',
    name: 'party:delete:own',
    description: 'Delete own parties',
  },
  {
    resource: 'party',
    action: 'read',
    scope: 'all',
    name: 'party:read:all',
    description: 'Read all parties',
  },
  {
    resource: 'party',
    action: 'update',
    scope: 'all',
    name: 'party:update:all',
    description: 'Update all parties',
  },
  {
    resource: 'party',
    action: 'delete',
    scope: 'all',
    name: 'party:delete:all',
    description: 'Delete all parties',
  },

  // Promoter permissions
  {
    resource: 'promoter',
    action: 'create',
    scope: 'own',
    name: 'promoter:create:own',
    description: 'Create promoters',
  },
  {
    resource: 'promoter',
    action: 'read',
    scope: 'own',
    name: 'promoter:read:own',
    description: 'Read own promoters',
  },
  {
    resource: 'promoter',
    action: 'update',
    scope: 'own',
    name: 'promoter:update:own',
    description: 'Update own promoters',
  },
  {
    resource: 'promoter',
    action: 'delete',
    scope: 'own',
    name: 'promoter:delete:own',
    description: 'Delete own promoters',
  },
  {
    resource: 'promoter',
    action: 'read',
    scope: 'all',
    name: 'promoter:read:all',
    description: 'Read all promoters',
  },
  {
    resource: 'promoter',
    action: 'update',
    scope: 'all',
    name: 'promoter:update:all',
    description: 'Update all promoters',
  },
  {
    resource: 'promoter',
    action: 'delete',
    scope: 'all',
    name: 'promoter:delete:all',
    description: 'Delete all promoters',
  },

  // User management permissions
  {
    resource: 'user',
    action: 'create',
    scope: 'all',
    name: 'user:create:all',
    description: 'Create users',
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'own',
    name: 'user:read:own',
    description: 'Read own user profile',
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'all',
    name: 'user:read:all',
    description: 'Read all users',
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'own',
    name: 'user:update:own',
    description: 'Update own profile',
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'all',
    name: 'user:update:all',
    description: 'Update all users',
  },
  {
    resource: 'user',
    action: 'delete',
    scope: 'all',
    name: 'user:delete:all',
    description: 'Delete users',
  },
  {
    resource: 'user',
    action: 'manage',
    scope: 'all',
    name: 'user:manage:all',
    description: 'Manage user accounts',
  },

  // Profile permissions
  {
    resource: 'profile',
    action: 'read',
    scope: 'own',
    name: 'profile:read:own',
    description: 'Read own profile',
  },
  {
    resource: 'profile',
    action: 'update',
    scope: 'own',
    name: 'profile:update:own',
    description: 'Update own profile',
  },
  {
    resource: 'profile',
    action: 'read',
    scope: 'all',
    name: 'profile:read:all',
    description: 'Read all profiles',
  },
  {
    resource: 'profile',
    action: 'update',
    scope: 'all',
    name: 'profile:update:all',
    description: 'Update all profiles',
  },

  // Dashboard permissions
  {
    resource: 'dashboard',
    action: 'view',
    scope: 'own',
    name: 'dashboard:view:own',
    description: 'View own dashboard',
  },
  {
    resource: 'dashboard',
    action: 'view',
    scope: 'all',
    name: 'dashboard:view:all',
    description: 'View all dashboards',
  },
  {
    resource: 'dashboard',
    action: 'manage',
    scope: 'all',
    name: 'dashboard:manage:all',
    description: 'Manage dashboards',
  },

  // Settings permissions
  {
    resource: 'settings',
    action: 'read',
    scope: 'own',
    name: 'settings:read:own',
    description: 'Read own settings',
  },
  {
    resource: 'settings',
    action: 'update',
    scope: 'own',
    name: 'settings:update:own',
    description: 'Update own settings',
  },
  {
    resource: 'settings',
    action: 'manage',
    scope: 'all',
    name: 'settings:manage:all',
    description: 'Manage system settings',
  },

  // Report permissions
  {
    resource: 'report',
    action: 'view',
    scope: 'own',
    name: 'report:view:own',
    description: 'View own reports',
  },
  {
    resource: 'report',
    action: 'view',
    scope: 'all',
    name: 'report:view:all',
    description: 'View all reports',
  },
  {
    resource: 'report',
    action: 'export',
    scope: 'all',
    name: 'report:export:all',
    description: 'Export reports',
  },

  // Audit permissions
  {
    resource: 'audit',
    action: 'read',
    scope: 'all',
    name: 'audit:read:all',
    description: 'View audit logs',
  },
];

// Define role-permission mappings
const rolePermissions = {
  admin: [
    // All permissions for admin
    ...permissions.map(p => p.name),
  ],
  manager: [
    // Manager permissions (read/write for most resources)
    'contract:create:own',
    'contract:read:own',
    'contract:read:all',
    'contract:update:own',
    'contract:delete:own',
    'contract:generate:own',
    'contract:export:own',
    'party:create:own',
    'party:read:own',
    'party:read:all',
    'party:update:own',
    'party:delete:own',
    'promoter:create:own',
    'promoter:read:own',
    'promoter:read:all',
    'promoter:update:own',
    'user:read:own',
    'user:read:all',
    'user:update:own',
    'profile:read:own',
    'profile:update:own',
    'profile:read:all',
    'dashboard:view:own',
    'dashboard:view:all',
    'settings:read:own',
    'settings:update:own',
    'report:view:own',
    'report:view:all',
    'report:export:all',
  ],
  user: [
    // Basic user permissions
    'contract:create:own',
    'contract:read:own',
    'contract:update:own',
    'contract:generate:own',
    'party:create:own',
    'party:read:own',
    'party:update:own',
    'promoter:read:own',
    'user:read:own',
    'user:update:own',
    'profile:read:own',
    'profile:update:own',
    'dashboard:view:own',
    'settings:read:own',
    'settings:update:own',
    'report:view:own',
  ],
  viewer: [
    // Read-only permissions
    'contract:read:own',
    'party:read:own',
    'promoter:read:own',
    'user:read:own',
    'profile:read:own',
    'dashboard:view:own',
    'settings:read:own',
    'report:view:own',
  ],
};

async function checkTableStructure() {
  console.log('🔍 Checking RBAC table structure...\n');

  // Check if we're using rbac_* tables or standard tables
  const { data: rbacRoles, error: rbacError } = await supabase
    .from('rbac_roles')
    .select('id')
    .limit(1);

  const { data: standardRoles, error: standardError } = await supabase
    .from('roles')
    .select('id')
    .limit(1);

  if (!rbacError) {
    console.log('✅ Using RBAC tables (rbac_* prefix)');
    return 'rbac';
  } else if (!standardError) {
    console.log('✅ Using standard tables (no prefix)');
    return 'standard';
  } else {
    console.error('❌ Cannot determine table structure:', {
      rbacError,
      standardError,
    });
    throw new Error('RBAC tables not found. Please run migrations first.');
  }
}

async function seedRoles(tablePrefix: string) {
  console.log('📝 Seeding roles...\n');

  const tableName = tablePrefix === 'rbac' ? 'rbac_roles' : 'roles';

  for (const role of roles) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .upsert(role, { onConflict: 'name' })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error seeding role ${role.name}:`, error.message);
      } else {
        console.log(`✅ Seeded role: ${role.name}`);
      }
    } catch (error) {
      console.error(`❌ Exception seeding role ${role.name}:`, error);
    }
  }

  console.log();
}

async function seedPermissions(tablePrefix: string) {
  console.log('📝 Seeding permissions...\n');

  const tableName = tablePrefix === 'rbac' ? 'rbac_permissions' : 'permissions';

  for (const permission of permissions) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .upsert(permission, { onConflict: 'name' })
        .select()
        .single();

      if (error) {
        console.error(
          `❌ Error seeding permission ${permission.name}:`,
          error.message
        );
      } else {
        console.log(`✅ Seeded permission: ${permission.name}`);
      }
    } catch (error) {
      console.error(
        `❌ Exception seeding permission ${permission.name}:`,
        error
      );
    }
  }

  console.log();
}

async function assignRolePermissions(tablePrefix: string) {
  console.log('📝 Assigning permissions to roles...\n');

  const rolesTable = tablePrefix === 'rbac' ? 'rbac_roles' : 'roles';
  const permsTable =
    tablePrefix === 'rbac' ? 'rbac_permissions' : 'permissions';
  const joinTable =
    tablePrefix === 'rbac' ? 'rbac_role_permissions' : 'role_permissions';

  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    console.log(`\n🔗 Assigning permissions to ${roleName}...`);

    // Get role ID
    const { data: role, error: roleError } = await supabase
      .from(rolesTable)
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError || !role) {
      console.error(`❌ Role ${roleName} not found`);
      continue;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const permName of permissionNames) {
      // Get permission ID
      const { data: perm, error: permError } = await supabase
        .from(permsTable)
        .select('id')
        .eq('name', permName)
        .single();

      if (permError || !perm) {
        console.error(`   ⚠️ Permission ${permName} not found`);
        errorCount++;
        continue;
      }

      // Assign permission to role
      const { error: assignError } = await supabase
        .from(joinTable)
        .upsert(
          { role_id: role.id, permission_id: perm.id },
          { onConflict: 'role_id,permission_id' }
        );

      if (assignError) {
        console.error(
          `   ❌ Error assigning ${permName}:`,
          assignError.message
        );
        errorCount++;
      } else {
        successCount++;
      }
    }

    console.log(
      `   ✅ Assigned ${successCount} permissions to ${roleName} (${errorCount} errors)`
    );
  }

  console.log();
}

async function assignAdminRole(tablePrefix: string) {
  console.log('📝 Assigning admin role to users...\n');

  const rolesTable = tablePrefix === 'rbac' ? 'rbac_roles' : 'roles';
  const assignmentsTable =
    tablePrefix === 'rbac' ? 'rbac_user_role_assignments' : 'user_roles';

  // Get admin role
  const { data: adminRole, error: roleError } = await supabase
    .from(rolesTable)
    .select('id')
    .eq('name', 'admin')
    .single();

  if (roleError || !adminRole) {
    console.error('❌ Admin role not found');
    return;
  }

  // Get users who should be admin
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, role')
    .or('role.eq.admin,email.ilike.%admin%');

  if (usersError || !users || users.length === 0) {
    console.log('⚠️ No admin users found. Please manually assign admin role.');
    return;
  }

  for (const user of users) {
    const { error: assignError } = await supabase.from(assignmentsTable).upsert(
      {
        user_id: user.id,
        role_id: adminRole.id,
        is_active: true,
      },
      { onConflict: 'user_id,role_id' }
    );

    if (assignError) {
      console.error(
        `❌ Error assigning admin role to ${user.email}:`,
        assignError.message
      );
    } else {
      console.log(`✅ Assigned admin role to: ${user.email}`);
    }
  }

  console.log();
}

async function refreshMaterializedView(tablePrefix: string) {
  if (tablePrefix !== 'rbac') {
    console.log(
      'ℹ️ Materialized view refresh only available for rbac_ tables\n'
    );
    return;
  }

  console.log('🔄 Refreshing materialized view...\n');

  try {
    const { error } = await supabase.rpc('rbac_refresh_user_permissions_mv');

    if (error) {
      console.error('❌ Error refreshing materialized view:', error.message);
    } else {
      console.log('✅ Materialized view refreshed successfully\n');
    }
  } catch (error) {
    console.error('❌ Exception refreshing materialized view:', error);
  }
}

async function main() {
  console.log('\n🚀 Permission Seeding Script\n');
  console.log('='.repeat(80) + '\n');

  try {
    const tablePrefix = await checkTableStructure();

    await seedRoles(tablePrefix);
    await seedPermissions(tablePrefix);
    await assignRolePermissions(tablePrefix);
    await assignAdminRole(tablePrefix);
    await refreshMaterializedView(tablePrefix);

    console.log('='.repeat(80));
    console.log('\n✅ Permission seeding completed successfully!\n');
    console.log('📋 Next steps:');
    console.log(
      '1. Run the diagnostic script to verify: npm run diagnose:auth'
    );
    console.log('2. Clear permission cache: npm run clear:cache');
    console.log('3. Test API endpoints to ensure they work correctly\n');
    console.log('='.repeat(80) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Permission seeding failed:', error);
    process.exit(1);
  }
}

main();
