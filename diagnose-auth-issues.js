const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function diagnoseIssues() {
  console.log('🔍 Diagnosing API and Authentication Issues...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('1. Environment Variables Check:');
  console.log('   Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('   Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('   Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  
  // Check if service key is different from anon key
  if (supabaseServiceKey === supabaseAnonKey) {
    console.log('   ❌ CRITICAL: Service key is the same as anon key!');
    console.log('   🔧 FIX NEEDED: Get the actual service role key from Supabase Dashboard');
  } else {
    console.log('   ✅ Service key is different from anon key');
  }
  
  console.log('\n2. Database Connection Test:');
  
  try {
    // Test with anon key
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: anonTest, error: anonError } = await anonClient
      .from('users')
      .select('count')
      .limit(1);
    
    console.log('   Anon client:', anonError ? '❌ ' + anonError.message : '✅ Connected');
    
    // Test with service key (if different)
    if (supabaseServiceKey !== supabaseAnonKey) {
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: serviceTest, error: serviceError } = await serviceClient
        .from('users')
        .select('count')
        .limit(1);
      
      console.log('   Service client:', serviceError ? '❌ ' + serviceError.message : '✅ Connected');
    }
    
  } catch (error) {
    console.log('   ❌ Connection test failed:', error.message);
  }
  
  console.log('\n3. Next Steps:');
  console.log('   📋 To fix the service key issue:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Go to Settings > API');
  console.log('   4. Copy the "service_role" key (it should be much longer and different)');
  console.log('   5. Replace SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.log('   6. Restart your development server');
  
  console.log('\n   📋 The const reassignment error has been fixed in the API route.');
  console.log('   📋 Once you fix the service key, the signup should work properly.');
}

diagnoseIssues().catch(console.error);
