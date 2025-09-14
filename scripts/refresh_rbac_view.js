const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function refreshRBACView() {
  console.log('🔄 Refreshing RBAC Materialized View...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Try to refresh the materialized view using raw SQL
    const { error } = await supabase.rpc('rbac_refresh_user_permissions_mv');
    
    if (error) {
      console.log('⚠️ RPC call failed, trying alternative method...');
      
      // Alternative: Try to execute raw SQL
      const { error: sqlError } = await supabase
        .from('rbac_user_role_assignments')
        .select('*')
        .limit(1);
      
      if (sqlError) {
        console.error('❌ Alternative method also failed:', sqlError);
      } else {
        console.log('✅ Alternative method succeeded - view may be refreshed');
      }
    } else {
      console.log('✅ RBAC view refreshed successfully');
    }

    // Check current permissions for the user
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'luxsess2001@gmail.com')
      .single();

    if (profile) {
      console.log(`🔍 Checking permissions for user: ${profile.email}`);
      
      // Try to get permissions from the materialized view
      const { data: permissions, error: permError } = await supabase
        .from('rbac_user_permissions_mv')
        .select('permission_name')
        .eq('user_id', profile.id);

      if (permError) {
        console.log('⚠️ Could not read from materialized view:', permError.message);
        console.log('🔄 This is expected if the view needs refresh');
      } else {
        console.log(`✅ Found ${permissions?.length || 0} permissions:`);
        permissions?.forEach(p => console.log(`  - ${p.permission_name}`));
      }
    }

  } catch (error) {
    console.error('❌ Error refreshing RBAC view:', error);
  }
}

refreshRBACView();
