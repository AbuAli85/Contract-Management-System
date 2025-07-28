const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserApprovalAPI() {
  try {
    console.log('🔧 Testing user approval API...');
    
    // First, sign in as an admin user to get a session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }
    
    console.log('✅ Signed in as admin:', signInData.user.email);
    
    // Get the session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('❌ No session available');
      return;
    }
    
    console.log('✅ Session obtained');
    
    // Test the user approval API
    const response = await fetch('http://localhost:3001/api/users/approval', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 API Response status:', response.status);
    
    const data = await response.json();
    console.log('📋 API Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ User approval API working correctly!');
      console.log(`📊 Found ${data.pendingUsers.length} pending users`);
      
      if (data.pendingUsers.length > 0) {
        console.log('\n📋 Pending users:');
        data.pendingUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.status}`);
          console.log(`   Name: ${user.full_name || 'N/A'}`);
          console.log(`   Created: ${user.created_at}`);
          console.log('');
        });
      }
    } else {
      console.error('❌ User approval API failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing user approval API:', error.message);
  }
}

testUserApprovalAPI(); 