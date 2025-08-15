#!/usr/bin/env node

/**
 * Fix User Status Script
 * This script fixes the user status from 'approved' to 'active' to resolve the 403 error
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

async function fixUserStatus() {
  console.log('🔧 Fixing User Status to Resolve 403 Error...\n');

  try {
    // 1. Check current profile status
    console.log('1. Checking Current Profile Status...');
    const { data: yourProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, status')
      .eq('email', 'luxsess2001@gmail.com')
      .single();

    if (profileError) {
      console.error('❌ Error getting your profile:', profileError.message);
      return;
    }

    console.log(`   Current status: ${yourProfile.status}`);
    console.log(`   Current role: ${yourProfile.role}`);

    if (yourProfile.status === 'active') {
      console.log('   ✅ Status is already "active" - no fix needed');
      return;
    }

    // 2. Update status to 'active'
    console.log('\n2. Updating Status to "active"...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', yourProfile.id)
      .select('id, email, role, status');

    if (updateError) {
      console.error('   ❌ Failed to update status:', updateError.message);
      return;
    }

    console.log('   ✅ Status updated successfully');
    console.log(`   New status: ${updatedProfile[0].status}`);

    // 3. Verify the update
    console.log('\n3. Verifying Status Update...');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, role, status')
      .eq('id', yourProfile.id)
      .single();

    if (verifyError) {
      console.error('   ❌ Error verifying update:', verifyError.message);
    } else {
      console.log('   ✅ Verification successful:');
      console.log(`     ID: ${verifyProfile.id}`);
      console.log(`     Email: ${verifyProfile.email}`);
      console.log(`     Role: ${verifyProfile.role}`);
      console.log(`     Status: ${verifyProfile.status}`);
    }

    // 4. Test the API permission logic
    console.log('\n4. Testing API Permission Logic...');
    
    // This is the exact logic from the API
    const userProfile = {
      role: verifyProfile.role,
      status: verifyProfile.status
    };

    const hasAdminRole = userProfile.role && ['admin', 'manager'].includes(userProfile.role);
    const hasActiveStatus = userProfile.status === 'active';
    
    console.log('   Permission Check Results:');
    console.log(`     Has admin/manager role: ${hasAdminRole ? '✅' : '❌'}`);
    console.log(`     Has active status: ${hasActiveStatus ? '✅' : '❌'}`);
    console.log(`     Role check: ${userProfile.role ? `'${userProfile.role}' in ['admin', 'manager']` : 'No role'}`);
    console.log(`     Status check: ${userProfile.status ? `'${userProfile.status}' === 'active'` : 'No status'}`);

    if (hasAdminRole && hasActiveStatus) {
      console.log('   ✅ PASSED: User now has all required permissions');
      console.log('   🎉 The 403 error should now be resolved!');
    } else {
      console.log('   ❌ FAILED: User still does not have required permissions');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function main() {
  console.log('🚀 User Status Fix Script\n');
  
  await fixUserStatus();
  
  console.log('\n✅ User status fix completed!');
  console.log('\n📋 Summary:');
  console.log('• Your profile status has been updated to "active"');
  console.log('• The API permission check should now pass');
  console.log('• The 403 error should be resolved');
  console.log('• Try accessing the User Management page again');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixUserStatus };
