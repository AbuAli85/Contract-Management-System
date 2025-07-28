const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetTestUser() {
  try {
    console.log('🔧 Resetting test user...');
    
    // Update the test user's password
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      '80930177-48f8-4e0b-9302-8569b83e48f1', // test@example.com user ID
      {
        password: 'testpassword123',
        email_confirm: true
      }
    );
    
    if (updateError) {
      console.error('❌ Password update failed:', updateError.message);
      return;
    }
    
    console.log('✅ Password updated for test@example.com');
    
    // Check if user exists in users table, if not create it
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'test@example.com')
      .single();
    
    if (checkError && checkError.code === 'PGRST116') {
      // User doesn't exist in users table, create it
      console.log('🔧 Creating user profile in users table...');
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: '80930177-48f8-4e0b-9302-8569b83e48f1',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'admin',
          status: 'active',
          email_verified: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ User profile creation failed:', createError.message);
        return;
      }
      
      console.log('✅ User profile created:', newUser);
    } else if (existingUser) {
      console.log('✅ User profile already exists');
    }
    
    console.log('\n🎉 Test user reset successfully!');
    console.log('Email: test@example.com');
    console.log('Password: testpassword123');
    console.log('Role: admin');
    console.log('Status: active');
    
  } catch (error) {
    console.error('❌ Error resetting test user:', error.message);
  }
}

resetTestUser(); 