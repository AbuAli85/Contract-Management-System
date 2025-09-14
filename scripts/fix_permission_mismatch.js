const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixPermissionMismatch() {
  console.log('🔧 Fixing Permission Mismatch...');
  
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

    // 2. Get all contract permissions with their IDs
    const { data: contractPerms, error: permError } = await supabase
      .from('rbac_permissions')
      .select('id, name, description')
      .like('name', 'contract:%');

    if (permError) {
      console.error('❌ Failed to query contract permissions:', permError);
      return;
    }

    console.log(`\n🔍 Found ${contractPerms?.length || 0} contract permissions:`);
    contractPerms?.forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id})`);
    });

    // 3. Clear existing role-permission assignments for this role
    console.log('\n🧹 Clearing existing role-permission assignments...');
    const { error: deleteError } = await supabase
      .from('rbac_role_permissions')
      .delete()
      .eq('role_id', role.id);

    if (deleteError) {
      console.error('❌ Failed to clear existing assignments:', deleteError);
      return;
    }

    console.log('✅ Cleared existing assignments');

    // 4. Re-assign all contract permissions to the role
    console.log('\n🔗 Re-assigning contract permissions to role...');
    for (const perm of contractPerms || []) {
      const { error: assignError } = await supabase
        .from('rbac_role_permissions')
        .insert({
          role_id: role.id,
          permission_id: perm.id
        });

      if (assignError) {
        console.error(`❌ Failed to assign ${perm.name}:`, assignError);
      } else {
        console.log(`✅ Assigned: ${perm.name}`);
      }
    }

    // 5. Also assign some basic system permissions
    const basicPerms = [
      'user:read:all',
      'user:create:all',
      'user:update:all',
      'role:assign:all',
      'security:manage:all',
      'finance:manage:all',
      'reporting:analytics:all'
    ];

    console.log('\n🔗 Assigning basic system permissions...');
    for (const permName of basicPerms) {
      const { data: perm, error: permQueryError } = await supabase
        .from('rbac_permissions')
        .select('id')
        .eq('name', permName)
        .single();

      if (permQueryError || !perm) {
        console.warn(`⚠️ Permission not found: ${permName}`);
        continue;
      }

      const { error: assignError } = await supabase
        .from('rbac_role_permissions')
        .insert({
          role_id: role.id,
          permission_id: perm.id
        });

      if (assignError) {
        console.warn(`⚠️ Failed to assign ${permName}:`, assignError.message);
      } else {
        console.log(`✅ Assigned: ${permName}`);
      }
    }

    console.log('\n🎉 Permission assignments fixed!');
    console.log('🔄 Please restart your application and try the contract form again.');

  } catch (error) {
    console.error('❌ Error fixing permission mismatch:', error);
  }
}

fixPermissionMismatch();
