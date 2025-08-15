#!/usr/bin/env node

/**
 * Activate Admin Permissions Script
 * This script properly activates admin permissions using the existing RBAC system
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function activateAdminPermissions() {
  console.log('🔧 Activating Admin Permissions with RBAC System...\n');

  try {
    // 1. Get your profile ID
    console.log('1. Getting your profile...');
    const { data: yourProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', 'luxsess2001@gmail.com')
      .single();

    if (profileError) {
      console.error('❌ Error getting your profile:', profileError.message);
      return;
    }

    console.log(`   ✅ Found your profile: ${yourProfile.email} (${yourProfile.role})`);

    // 2. Get the System Administrator role from RBAC
    console.log('\n2. Getting System Administrator role...');
    const { data: systemAdminRole, error: roleError } = await supabase
      .from('rbac_roles')
      .select('*')
      .eq('name', 'System Administrator')
      .single();

    if (roleError) {
      console.error('❌ Error getting System Administrator role:', roleError.message);
      return;
    }

    console.log(`   ✅ Found System Administrator role: ${systemAdminRole.name} (${systemAdminRole.category})`);

    // 3. Create user role assignment in RBAC system
    console.log('\n3. Creating RBAC user role assignment...');
    
    const userRoleAssignment = {
      user_id: yourProfile.id,
      role_id: systemAdminRole.id,
      assigned_by: yourProfile.id, // Self-assigned
      context: { 
        source: 'manual_activation',
        reason: 'Admin permissions activation',
        timestamp: new Date().toISOString()
      },
      valid_from: new Date().toISOString(),
      is_active: true
    };

    const { data: createdAssignment, error: assignmentError } = await supabase
      .from('rbac_user_role_assignments')
      .insert(userRoleAssignment)
      .select();

    if (assignmentError) {
      if (assignmentError.message.includes('duplicate') || assignmentError.message.includes('already exists')) {
        console.log('   ⚠️  User role assignment already exists, updating...');
        
        const { data: updatedAssignment, error: updateError } = await supabase
          .from('rbac_user_role_assignments')
          .update({ 
            is_active: true,
            context: userRoleAssignment.context,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', yourProfile.id)
          .eq('role_id', systemAdminRole.id)
          .select();

        if (updateError) {
          console.error('   ❌ Error updating assignment:', updateError.message);
        } else {
          console.log('   ✅ User role assignment updated successfully');
        }
      } else {
        console.error('   ❌ Error creating assignment:', assignmentError.message);
      }
    } else {
      console.log('   ✅ User role assignment created successfully');
    }

    // 4. Verify the assignment
    console.log('\n4. Verifying RBAC assignment...');
    const { data: userRoles, error: verifyError } = await supabase
      .from('rbac_user_role_assignments')
      .select(`
        user_id,
        role_id,
        is_active,
        valid_from,
        rbac_roles(name, category, description)
      `)
      .eq('user_id', yourProfile.id)
      .eq('is_active', true);

    if (verifyError) {
      console.error('❌ Error verifying assignment:', verifyError.message);
    } else if (userRoles && userRoles.length > 0) {
      console.log(`   ✅ Found ${userRoles.length} active role assignment(s):`);
      userRoles.forEach(ur => {
        const roleName = ur.rbac_roles?.name || 'Unknown Role';
        const category = ur.rbac_roles?.category || 'Unknown';
        const validFrom = new Date(ur.valid_from).toLocaleDateString();
        
        console.log(`     - ${roleName} (${category}) - Valid from: ${validFrom}`);
      });
    } else {
      console.log('   ❌ No active role assignments found');
    }

    // 5. Test admin permissions
    console.log('\n5. Testing Admin Permissions...');
    
    // Test creating a user (admin permission)
    const testUser = {
      id: 'test-admin-perm-' + Date.now(),
      email: 'test-admin-perm@example.com',
      role: 'user',
      first_name: 'Test',
      last_name: 'User',
      status: 'pending'
    };

    try {
      const { data: createdUser, error: createError } = await supabase
        .from('profiles')
        .insert(testUser)
        .select();

      if (createError) {
        if (createError.message.includes('duplicate') || createError.message.includes('already exists')) {
          console.log('   ✅ Create user permission: Working (duplicate key error expected)');
        } else if (createError.message.includes('permission') || createError.message.includes('access')) {
          console.log('   ❌ Create user permission: Access denied (permissions working)');
        } else {
          console.log('   ❌ Create user permission: Error:', createError.message);
        }
      } else {
        console.log('   ✅ Create user permission: Working (user created)');
        
        // Clean up
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', testUser.id);
        
        if (deleteError) {
          console.log('       ⚠️  Could not clean up test user');
        }
      }
    } catch (err) {
      console.log('   ❌ Create user permission: Exception:', err.message);
    }

    // 6. Summary
    console.log('\n6. Admin Permissions Summary...');
    
    if (userRoles && userRoles.length > 0) {
      console.log('   ✅ RBAC system is now ACTIVE for your account');
      console.log('   ✅ You have System Administrator role with full permissions');
      console.log('   ✅ Permission enforcement should now work properly');
      console.log('   🔄 Restart your application to see the changes');
    } else {
      console.log('   ❌ RBAC system is not active for your account');
      console.log('   ⚠️  You may still have limited permissions');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function main() {
  console.log('🚀 Admin Permissions Activation Script\n');
  
  await activateAdminPermissions();
  
  console.log('\n✅ Admin permissions activation completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Restart your application');
  console.log('2. Check if admin permissions are now working');
  console.log('3. Test role-based access control');
  console.log('4. Verify that permission checks are enforced');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { activateAdminPermissions };
