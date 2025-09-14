const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixContractPermissions() {
  console.log('🔧 Fixing Contract Permissions for luxsess2001@gmail.com...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'luxsess2001@gmail.com')
      .single();

    if (profileError || !profile) {
      console.error('❌ User profile not found:', profileError);
      return;
    }

    console.log('✅ Found user profile:', profile.email, profile.id);

    // 2. Get Platform Administrator role
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

    // 3. Ensure contract permissions exist
    const contractPermissions = [
      'contract:read:own',
      'contract:create:own',
      'contract:update:own',
      'contract:generate:own',
      'contract:download:own',
      'contract:approve:all',
      'contract:message:own'
    ];

    console.log('🔍 Ensuring contract permissions exist...');
    for (const permName of contractPermissions) {
      const [resource, action, scope] = permName.split(':');
      const { error: permError } = await supabase.rpc('rbac_upsert_permission', {
        p_resource: resource,
        p_action: action,
        p_scope: scope,
        p_name: permName,
        p_description: `${action} ${resource} with ${scope} scope`
      });
      
      if (permError) {
        console.warn('⚠️ Permission creation warning:', permError.message);
      }
    }

    // 4. Check if role assignment already exists
    const { data: existingAssignments, error: checkError } = await supabase
      .from('rbac_user_role_assignments')
      .select('id, is_active')
      .eq('user_id', profile.id)
      .eq('role_id', role.id);

    if (checkError) {
      console.error('❌ Failed to check existing assignments:', checkError);
      return;
    }

    if (existingAssignments && existingAssignments.length > 0) {
      console.log(`✅ Found ${existingAssignments.length} existing role assignment(s), updating...`);
      
      // Update all existing assignments to be active
      for (const assignment of existingAssignments) {
        const { error: updateError } = await supabase
          .from('rbac_user_role_assignments')
          .update({
            is_active: true,
            assigned_by: profile.id
          })
          .eq('id', assignment.id);

        if (updateError) {
          console.error('❌ Failed to update role assignment:', updateError);
          return;
        }
      }
    } else {
      console.log('✅ Creating new role assignment...');
      // Create new assignment
      const { error: insertError } = await supabase
        .from('rbac_user_role_assignments')
        .insert({
          user_id: profile.id,
          role_id: role.id,
          assigned_by: profile.id,
          is_active: true
        });

      if (insertError) {
        console.error('❌ Failed to create role assignment:', insertError);
        return;
      }
    }

    console.log('✅ Role assigned successfully');

    // 5. Refresh materialized view
    const { error: refreshError } = await supabase.rpc('rbac_refresh_user_permissions_mv');
    
    if (refreshError) {
      console.error('❌ Failed to refresh RBAC view:', refreshError);
      return;
    }

    console.log('✅ RBAC view refreshed');

    // 6. Verify permissions
    const { data: permissions, error: verifyError } = await supabase
      .from('rbac_user_permissions_mv')
      .select('permission_name')
      .eq('user_id', profile.id);

    if (verifyError) {
      console.error('❌ Failed to verify permissions:', verifyError);
      return;
    }

    console.log('🔍 User permissions:');
    permissions.forEach(p => console.log(`  - ${p.permission_name}`));

    console.log('\n🎉 Contract permissions fixed successfully!');
    console.log('🔄 Please restart your application and try the contract form again.');

  } catch (error) {
    console.error('❌ Error fixing contract permissions:', error);
  }
}

fixContractPermissions();
