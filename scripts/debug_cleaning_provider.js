import { createClient } from '@supabase/supabase-js';

// Your actual Supabase credentials from env-setup.ps1
const supabaseUrl = 'https://reootcngcptfogfozlmz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ0NDM4MiwiZXhwIjoyMDY5MDIwMzgyfQ.BTLA-2wwXJgjW6MKoaw2ERbCr_fXF9w4zgLb70_5DAE';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugCleaningProvider() {
  try {
    console.log('🔍 Debugging cleaning.provider@example.com foreign key issue...\n');
    
    // Step 1: Find the user by email
    console.log('📧 Looking for user: cleaning.provider@example.com');
    const { data: userByEmail, error: userByEmailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'cleaning.provider@example.com')
      .single();
    
    if (userByEmailError) {
      console.error('❌ Error finding user by email:', userByEmailError.message);
      return;
    }
    
    console.log('✅ User found in users table:');
    console.log('  ID:', userByEmail.id);
    console.log('  Email:', userByEmail.email);
    console.log('  Role:', userByEmail.role);
    console.log('  Full Name:', userByEmail.full_name);
    console.log('  Status:', userByEmail.status);
    console.log('  Created At:', userByEmail.created_at);
    console.log('  Updated At:', userByEmail.updated_at);
    console.log('');
    
    // Step 2: Check if this user exists in profiles table
    console.log('👤 Checking profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userByEmail.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile not found:', profileError.message);
    } else {
      console.log('✅ Profile found:');
      console.log('  ID:', profileData.id);
      console.log('  Email:', profileData.email);
      console.log('  Role:', profileData.role);
      console.log('  Full Name:', profileData.full_name);
    }
    console.log('');
    
    // Step 3: Check if this user exists in user_roles table
    console.log('🔑 Checking user_roles table...');
    const { data: userRolesData, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userByEmail.id);
    
    if (userRolesError) {
      console.log('❌ User roles query failed:', userRolesError.message);
    } else {
      console.log(`✅ Found ${userRolesData.length} user role entries:`);
      userRolesData.forEach((role, index) => {
        console.log(`  ${index + 1}. ID: ${role.id}, User ID: ${role.user_id}, Role: ${role.role}`);
      });
    }
    console.log('');
    
    // Step 4: Check the exact data types and constraints
    console.log('🔧 Checking data types and constraints...');
    
    // Try to get table schema info
    const { data: usersSchema, error: usersSchemaError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (!usersSchemaError) {
      console.log('✅ Users table accessible');
      console.log('  Sample ID type:', typeof usersSchema[0]?.id);
      console.log('  Sample ID value:', usersSchema[0]?.id);
    }
    
    const { data: userRolesSchema, error: userRolesSchemaError } = await supabase
      .from('user_roles')
      .select('user_id')
      .limit(1);
    
    if (!userRolesSchemaError) {
      console.log('✅ User_roles table accessible');
      console.log('  Sample user_id type:', typeof userRolesSchema[0]?.user_id);
      console.log('  Sample user_id value:', userRolesSchema[0]?.user_id);
    }
    console.log('');
    
    // Step 5: Test the specific insert that's failing
    console.log('🧪 Testing the failing insert...');
    try {
      const { data: testInsert, error: testInsertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userByEmail.id,
          role: 'user' // mapped role
        })
        .select();
      
      if (testInsertError) {
        console.log('❌ Test insert failed:', testInsertError.message);
        console.log('  Error details:', testInsertError.details);
        console.log('  Error hint:', testInsertError.hint);
      } else {
        console.log('✅ Test insert succeeded:', testInsert);
      }
    } catch (insertError) {
      console.log('❌ Test insert exception:', insertError.message);
    }
    console.log('');
    
    // Step 6: Summary and recommendations
    console.log('📋 Summary:');
    console.log('- User exists in users table ✅');
    console.log('- User ID:', userByEmail.id);
    console.log('- Foreign key constraint violation suggests data type or reference issue');
    console.log('');
    console.log('💡 Recommendations:');
    console.log('1. Check if user_roles.user_id column type matches users.id column type');
    console.log('2. Verify the user ID is not corrupted or malformed');
    console.log('3. Check if there are any triggers or constraints interfering');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugCleaningProvider();
