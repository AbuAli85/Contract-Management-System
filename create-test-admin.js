// Create admin user for testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestAdmin() {
  try {
    console.log('🔧 Setting up test admin user...');
    
    // First, try to get existing user
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }
    
    const testUser = existingUsers.users.find(u => u.email === 'test@example.com');
    
    if (testUser) {
      console.log('✅ Found existing test user, updating password...');
      
      // Update the password
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        testUser.id,
        { 
          password: 'test123456',
          user_metadata: {
            full_name: 'Test Admin',
            role: 'admin'
          }
        }
      );
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError);
        return;
      } else {
        console.log('✅ Password updated successfully');
      }
    } else {
      console.log('ℹ️ Test user not found, creating new one...');
      
      // Create user in auth system
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'test123456',
        user_metadata: {
          full_name: 'Test Admin',
          role: 'admin'
        },
        email_confirm: true
      });

      if (authError) {
        console.error('❌ Error creating auth user:', authError);
        return;
      } else {
        console.log('✅ Admin user created in auth system:', authUser.user?.email);
      }
    }

    // Update user in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: testUser?.id || '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        full_name: 'Test Admin',
        role: 'admin',
        status: 'active'
      });

    if (userError) {
      console.error('❌ Error creating user record:', userError);
    } else {
      console.log('✅ User record created/updated');
    }

    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: testUser?.id || '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        full_name: 'Test Admin',
        role: 'admin',
        status: 'active'
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
    } else {
      console.log('✅ Profile created/updated');
    }

    console.log('\n🎉 Test admin user is ready!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: test123456');
    console.log('\n🔗 Next steps:');
    console.log('1. Go to http://localhost:3002/en/auth/login');
    console.log('2. Login with the credentials above');
    console.log('3. Navigate to http://localhost:3002/generate-contract');
    console.log('4. Test contract generation functionality');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestAdmin();
