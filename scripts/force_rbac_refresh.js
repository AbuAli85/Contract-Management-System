const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function forceRBACRefresh() {
  console.log('🔄 Forcing RBAC View Refresh...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'luxsess2001@gmail.com')
      .single();

    if (profileError || !profile) {
      console.error('❌ User profile not found:', profileError);
      return;
    }

    console.log('✅ Found user profile:', profile.email);

    // Make a small update to trigger view refresh
    const { error: updateError } = await supabase
      .from('rbac_user_role_assignments')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .limit(1);

    if (updateError) {
      console.warn('⚠️ Update failed, trying alternative method:', updateError.message);
      
      // Alternative: Insert a temporary record and delete it
      const tempRoleId = '90cb61fa-e9b5-48bb-9387-b9aff2d8c33c'; // Platform Administrator
      
      // Check if we can insert a temporary record
      const { error: insertError } = await supabase
        .from('rbac_user_role_assignments')
        .insert({
          user_id: profile.id,
          role_id: tempRoleId,
          assigned_by: profile.id,
          is_active: false,
          context: { reason: 'temporary_refresh_trigger' }
        });

      if (insertError) {
        console.warn('⚠️ Temporary insert also failed:', insertError.message);
      } else {
        console.log('✅ Temporary record inserted, now deleting...');
        
        // Delete the temporary record
        const { error: deleteError } = await supabase
          .from('rbac_user_role_assignments')
          .delete()
          .eq('user_id', profile.id)
          .eq('role_id', tempRoleId)
          .eq('context->>reason', 'temporary_refresh_trigger');

        if (deleteError) {
          console.warn('⚠️ Failed to delete temporary record:', deleteError.message);
        } else {
          console.log('✅ Temporary record deleted');
        }
      }
    } else {
      console.log('✅ Update successful, view should be refreshed');
    }

    // Wait a moment for the view to update
    console.log('⏳ Waiting for view to refresh...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check permissions again
    const { data: permissions, error: permError } = await supabase
      .from('rbac_user_permissions_mv')
      .select('permission_name')
      .eq('user_id', profile.id);

    if (permError) {
      console.log('⚠️ Still cannot read from materialized view:', permError.message);
    } else {
      console.log(`✅ Found ${permissions?.length || 0} permissions after refresh:`);
      permissions?.forEach(p => console.log(`  - ${p.permission_name}`));
      
      // Check for contract permissions specifically
      const contractPerms = permissions?.filter(p => p.permission_name.startsWith('contract:')) || [];
      console.log(`\n🔍 Contract permissions: ${contractPerms.length}`);
      contractPerms.forEach(p => console.log(`  - ${p.permission_name}`));
    }

  } catch (error) {
    console.error('❌ Error forcing RBAC refresh:', error);
  }
}

forceRBACRefresh();
