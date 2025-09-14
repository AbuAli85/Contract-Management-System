const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkRBACStructure() {
  console.log('🔍 Checking RBAC Table Structure...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check rbac_role_permissions table structure
    const { data: rolePerms, error: rolePermsError } = await supabase
      .from('rbac_role_permissions')
      .select('*')
      .limit(1);

    if (rolePermsError) {
      console.error('❌ Error reading rbac_role_permissions:', rolePermsError);
    } else {
      console.log('✅ rbac_role_permissions table accessible');
      if (rolePerms && rolePerms.length > 0) {
        console.log('📋 Sample record:', rolePerms[0]);
      }
    }

    // Check rbac_user_role_assignments table structure
    const { data: userRoles, error: userRolesError } = await supabase
      .from('rbac_user_role_assignments')
      .select('*')
      .limit(1);

    if (userRolesError) {
      console.error('❌ Error reading rbac_user_role_assignments:', userRolesError);
    } else {
      console.log('✅ rbac_user_role_assignments table accessible');
      if (userRoles && userRoles.length > 0) {
        console.log('📋 Sample record:', userRoles[0]);
      }
    }

    // Check current user permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'luxsess2001@gmail.com')
      .single();

    if (profile) {
      console.log(`\n🔍 Checking permissions for user: ${profile.email}`);
      
      const { data: permissions, error: permError } = await supabase
        .from('rbac_user_permissions_mv')
        .select('permission_name')
        .eq('user_id', profile.id);

      if (permError) {
        console.log('⚠️ Could not read from materialized view:', permError.message);
      } else {
        console.log(`✅ Found ${permissions?.length || 0} permissions:`);
        permissions?.forEach(p => console.log(`  - ${p.permission_name}`));
      }
    }

  } catch (error) {
    console.error('❌ Error checking RBAC structure:', error);
  }
}

checkRBACStructure();
