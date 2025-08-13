const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Make sure to use your actual Supabase URL and service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');

    // First, let's see what users exist
    console.log('👥 Checking existing users...');
    const { data: existingUsers, error: listError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .order('created_at', { ascending: false })
      .limit(10);

    if (listError) {
      console.error('❌ Error listing users:', listError);
    } else {
      console.log('📋 Existing users:', existingUsers);
    }

    // Create a new admin user
    const adminEmail = 'admin@contractmanagement.com';
    const adminPassword = 'AdminPass123!';

    console.log(`📧 Creating user with email: ${adminEmail}`);

    // Create the auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator',
        role: 'admin'
      }
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      
      // Try to find existing user if creation failed due to duplicate
      if (authError.message.includes('already exists') || authError.message.includes('duplicate')) {
        console.log('👤 User already exists, trying to find and update...');
        
        const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserByEmail(adminEmail);
        
        if (existingUser && existingUser.user) {
          console.log('✅ Found existing user:', existingUser.user.id);
          
          // Update the user profile to admin
          const { data: updatedProfile, error: updateError } = await supabase
            .from('users')
            .upsert({
              id: existingUser.user.id,
              email: adminEmail,
              full_name: 'System Administrator',
              role: 'admin',
              status: 'active',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
            .select()
            .single();

          if (updateError) {
            console.error('❌ Profile update failed:', updateError);
          } else {
            console.log('✅ Admin profile updated:', updatedProfile);
            console.log('\n🎉 Admin user is ready!');
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            console.log('🔗 Login at: http://localhost:3002/en/auth/login');
          }
        }
        return;
      } else {
        return;
      }
    }

    if (!authUser.user) {
      console.error('❌ No user returned from auth creation');
      return;
    }

    console.log('✅ Auth user created:', authUser.user.id);

    // Create/update the user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authUser.user.id,
        email: adminEmail,
        full_name: 'System Administrator',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      return;
    }

    console.log('✅ User profile created:', userProfile);

    console.log('\n🎉 Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('🔗 Login at: http://localhost:3002/en/auth/login');
    console.log('\n📋 After logging in, you can:');
    console.log('• View pending user registrations');
    console.log('• Approve/reject new users');
    console.log('• Manage user roles and permissions');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function promoteExistingUser() {
  try {
    console.log('🔄 Looking for users to promote to admin...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, status')
      .neq('role', 'admin')
      .limit(5);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('📋 No users found to promote');
      return;
    }

    console.log('👥 Available users to promote:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}, ${user.status})`);
    });

    // Auto-promote the first user for demo
    const userToPromote = users[0];
    console.log(`🔄 Auto-promoting: ${userToPromote.email}`);

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userToPromote.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to promote user:', updateError);
      return;
    }

    console.log('✅ User promoted to admin:', updatedUser);
    console.log(`📧 You can now login as: ${updatedUser.email}`);

  } catch (error) {
    console.error('❌ Error promoting user:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Admin Setup Tool');
  console.log('==================');
  
  // First try to promote existing user
  await promoteExistingUser();
  
  // Then create new admin if needed
  await createAdminUser();
}

main();
