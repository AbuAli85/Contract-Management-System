const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function addMissingContractPermissions() {
  console.log('🔧 Adding Missing Contract Permissions...');
  
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

    // 2. Define missing contract permissions
    const missingPermissions = [
      { resource: 'contract', action: 'create', scope: 'own', name: 'contract:create:own', description: 'Create own contracts' },
      { resource: 'contract', action: 'update', scope: 'own', name: 'contract:update:own', description: 'Update own contracts' },
      { resource: 'contract', action: 'generate', scope: 'own', name: 'contract:generate:own', description: 'Generate own contracts' },
      { resource: 'contract', action: 'download', scope: 'own', name: 'contract:download:own', description: 'Download own contracts' },
      { resource: 'contract', action: 'approve', scope: 'all', name: 'contract:approve:all', description: 'Approve all contracts' },
      { resource: 'contract', action: 'message', scope: 'own', name: 'contract:message:own', description: 'Send contract messages' }
    ];

    console.log('🔍 Adding missing contract permissions...');
    
    for (const perm of missingPermissions) {
      // Create permission if it doesn't exist
      const { error: permError } = await supabase.rpc('rbac_upsert_permission', {
        p_resource: perm.resource,
        p_action: perm.action,
        p_scope: perm.scope,
        p_name: perm.name,
        p_description: perm.description
      });
      
      if (permError) {
        console.warn(`⚠️ Permission creation warning for ${perm.name}:`, permError.message);
      } else {
        console.log(`✅ Permission created/updated: ${perm.name}`);
      }
    }

    // 3. Get all contract permissions
    const { data: contractPerms, error: permQueryError } = await supabase
      .from('rbac_permissions')
      .select('id, name')
      .like('name', 'contract:%');

    if (permQueryError) {
      console.error('❌ Failed to query contract permissions:', permQueryError);
      return;
    }

    console.log(`🔍 Found ${contractPerms?.length || 0} contract permissions`);

    // 4. Assign all contract permissions to Platform Administrator role
    for (const perm of contractPerms || []) {
      // Check if permission is already assigned
      const { data: existingAssignment, error: checkError } = await supabase
        .from('rbac_role_permissions')
        .select('role_id')
        .eq('role_id', role.id)
        .eq('permission_id', perm.id)
        .maybeSingle();

      if (checkError) {
        console.warn(`⚠️ Could not check existing assignment for ${perm.name}:`, checkError.message);
        continue;
      }

      if (existingAssignment) {
        console.log(`✅ Permission already assigned: ${perm.name}`);
      } else {
        // Assign permission
        const { error: assignError } = await supabase
          .from('rbac_role_permissions')
          .insert({
            role_id: role.id,
            permission_id: perm.id
          });

        if (assignError) {
          console.warn(`⚠️ Permission assignment warning for ${perm.name}:`, assignError.message);
        } else {
          console.log(`✅ Permission assigned: ${perm.name}`);
        }
      }
    }

    console.log('\n🎉 Missing contract permissions added successfully!');
    console.log('🔄 Please restart your application and try the contract form again.');

  } catch (error) {
    console.error('❌ Error adding missing contract permissions:', error);
  }
}

addMissingContractPermissions();
