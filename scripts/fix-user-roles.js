#!/usr/bin/env node

/**
 * Fix User Roles and Create Test Users Script
 * This script fixes user roles and creates multiple test users
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

async function fixUserRoles() {
  console.log('🔧 Fixing User Roles and Creating Test Users...\n');

  try {
    // 1. Check current profiles
    console.log('1. Checking current profiles...');
    const { data: currentProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Error checking profiles:', profilesError.message);
      return;
    }

    if (currentProfiles && currentProfiles.length > 0) {
      console.log(`   Found ${currentProfiles.length} existing profile(s):`);
      currentProfiles.forEach(profile => {
        console.log(`     - ${profile.email} (${profile.role}) - ID: ${profile.id}`);
      });
    } else {
      console.log('   No existing profiles found');
    }

    // 2. Fix your role to admin
    console.log('\n2. Fixing your role to admin...');
    const yourProfile = currentProfiles?.find(p => p.email === 'luxsess2001@gmail.com');
    
    if (yourProfile) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          first_name: 'Luxsess',
          last_name: 'Admin',
          status: 'approved'
        })
        .eq('id', yourProfile.id)
        .select();

      if (updateError) {
        console.error('   ❌ Failed to update role:', updateError.message);
      } else {
        console.log('   ✅ Role updated to admin:', updatedProfile[0]);
      }
    } else {
      console.log('   ⚠️  Your profile not found, will create it');
    }

    // 3. Create additional test users with different roles
    console.log('\n3. Creating additional test users...');
    
    const testUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@example.com',
        role: 'admin',
        first_name: 'System',
        last_name: 'Administrator',
        status: 'approved'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'manager@example.com',
        role: 'manager',
        first_name: 'Project',
        last_name: 'Manager',
        status: 'approved'
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'promoter@example.com',
        role: 'promoter',
        first_name: 'Sales',
        last_name: 'Promoter',
        status: 'approved'
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'client@example.com',
        role: 'client',
        first_name: 'Business',
        last_name: 'Client',
        status: 'approved'
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'provider@example.com',
        role: 'provider',
        first_name: 'Service',
        last_name: 'Provider',
        status: 'approved'
      }
    ];

    for (const testUser of testUsers) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', testUser.id)
        .single();

      if (existingUser) {
        console.log(`   ⚠️  User ${testUser.email} already exists, updating role...`);
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: testUser.role,
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            status: testUser.status
          })
          .eq('id', testUser.id)
          .select();

        if (updateError) {
          console.log(`     ❌ Failed to update ${testUser.email}:`, updateError.message);
        } else {
          console.log(`     ✅ Updated ${testUser.email} to ${testUser.role} role`);
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert(testUser)
          .select();

        if (createError) {
          console.log(`     ❌ Failed to create ${testUser.email}:`, createError.message);
        } else {
          console.log(`     ✅ Created ${testUser.email} with ${testUser.role} role`);
        }
      }
    }

    // 4. Verify all users
    console.log('\n4. Verifying all users...');
    const { data: allProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true });

    if (verifyError) {
      console.error('❌ Error verifying profiles:', verifyError.message);
    } else {
      console.log(`   ✅ Total profiles: ${allProfiles.length}`);
      
      // Group by role
      const usersByRole = allProfiles.reduce((acc, profile) => {
        if (!acc[profile.role]) acc[profile.role] = [];
        acc[profile.role].push(profile);
        return acc;
      }, {});

      Object.entries(usersByRole).forEach(([role, users]) => {
        console.log(`     ${role.toUpperCase()}: ${users.length} user(s)`);
        users.forEach(user => {
          console.log(`       - ${user.email} (${user.first_name} ${user.last_name})`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function main() {
  console.log('🚀 User Role Fix and Test User Creation Script\n');
  
  await fixUserRoles();
  
  console.log('\n✅ User roles fixed and test users created!');
  console.log('\n📋 Next Steps:');
  console.log('1. Restart your application');
  console.log('2. You should now have admin role');
  console.log('3. Multiple test users with different roles available');
  console.log('4. Test role-based access control');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixUserRoles };
