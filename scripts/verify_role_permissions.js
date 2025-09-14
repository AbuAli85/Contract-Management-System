const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifyRolePermissions() {
  console.log('🔍 Verifying Role-Permission Assignments...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Get Platform Administrator role
    const { data: role, error: roleError } = await supabase
      .from('rbac_roles')
      .select('id, name')
      .eq('name', 'Platform Administrator')
      .single();

    if (roleError || !role) {
      console.error('❌ Platform Administrator role not found:', roleError);
      return;
    }

    console.log('✅ Found role:', role.name, role.id);

    // 2. Check what permissions are assigned to this role
    const { data: rolePermissions, error: rolePermsError } = await supabase
      .from('rbac_role_permissions')
      .select(`
        permission_id,
        rbac_permissions!inner(name, description)
      `)
      .eq('role_id', role.id);

    if (rolePermsError) {
      console.error('❌ Failed to query role permissions:', rolePermsError);
      return;
    }

    console.log(`\n🔍 Role has ${rolePermissions?.length || 0} permissions:`);
    rolePermissions?.forEach(rp => {
      console.log(`  - ${rp.rbac_permissions.name}: ${rp.rbac_permissions.description}`);
    });

    // 3. Check specifically for contract permissions
    const contractPerms = rolePermissions?.filter(rp => 
      rp.rbac_permissions.name.startsWith('contract:')
    ) || [];

    console.log(`\n📋 Contract permissions assigned to role: ${contractPerms.length}`);
    contractPerms.forEach(rp => {
      console.log(`  - ${rp.rbac_permissions.name}`);
    });

    // 4. Check user's role assignments
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'luxsess2001@gmail.com')
      .single();

    if (profile) {
      console.log(`\n👤 User ${profile.email} role assignments:`);
      
      const { data: userRoles, error: userRolesError } = await supabase
        .from('rbac_user_role_assignments')
        .select(`
          role_id,
          is_active,
          rbac_roles!inner(name)
        `)
        .eq('user_id', profile.id)
        .eq('is_active', true);

      if (userRolesError) {
        console.error('❌ Failed to query user roles:', userRolesError);
      } else {
        userRoles?.forEach(ur => {
          console.log(`  - ${ur.rbac_roles.name} (active: ${ur.is_active})`);
        });
      }

      // 5. Calculate expected permissions manually
      console.log('\n🧮 Calculating expected permissions manually...');
      const expectedPermissions = new Set();
      
      for (const userRole of userRoles || []) {
        const rolePerms = rolePermissions?.filter(rp => rp.permission_id === userRole.role_id) || [];
        rolePerms.forEach(rp => expectedPermissions.add(rp.rbac_permissions.name));
      }

      console.log(`Expected permissions: ${expectedPermissions.size}`);
      Array.from(expectedPermissions).sort().forEach(perm => {
        console.log(`  - ${perm}`);
      });

      // 6. Check what the materialized view shows
      console.log('\n📊 Materialized view permissions:');
      const { data: viewPermissions, error: viewError } = await supabase
        .from('rbac_user_permissions_mv')
        .select('permission_name')
        .eq('user_id', profile.id);

      if (viewError) {
        console.log('❌ Cannot read from materialized view:', viewError.message);
      } else {
        console.log(`View shows: ${viewPermissions?.length || 0} permissions`);
        viewPermissions?.forEach(p => console.log(`  - ${p.permission_name}`));
      }
    }

  } catch (error) {
    console.error('❌ Error verifying role permissions:', error);
  }
}

verifyRolePermissions();
