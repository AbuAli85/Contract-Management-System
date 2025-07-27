const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLoginFlow() {
  try {
    console.log('🔧 Testing complete login and dashboard flow...');
    
    // Step 1: Test login
    console.log('\n📝 Step 1: Testing login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (signInError) {
      console.error('❌ Login failed:', signInError.message);
      return;
    }
    
    console.log('✅ Login successful:', signInData.user.email);
    
    // Step 2: Get session
    console.log('\n📝 Step 2: Getting session...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('❌ No session available');
      return;
    }
    
    console.log('✅ Session obtained');
    
    // Step 3: Test user profile loading
    console.log('\n📝 Step 3: Testing user profile...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, status, full_name')
      .eq('id', signInData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile loading failed:', profileError.message);
    } else {
      console.log('✅ Profile loaded:', {
        email: userProfile.email,
        role: userProfile.role,
        status: userProfile.status,
        name: userProfile.full_name
      });
    }
    
    // Step 4: Test analytics API
    console.log('\n📝 Step 4: Testing analytics API...');
    const response = await fetch('http://localhost:3001/api/dashboard/analytics', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Analytics API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Analytics API working:', data.success);
      if (data.success && data.stats) {
        console.log('📊 Dashboard stats:', data.stats);
      }
    } else {
      console.error('❌ Analytics API failed:', response.status);
      const errorData = await response.json();
      console.error('Error details:', errorData);
    }
    
    // Step 5: Test user approval API
    console.log('\n📝 Step 5: Testing user approval API...');
    const approvalResponse = await fetch('http://localhost:3001/api/users/approval', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Approval API Response status:', approvalResponse.status);
    
    if (approvalResponse.ok) {
      const approvalData = await approvalResponse.json();
      console.log('✅ Approval API working:', approvalData.success);
      if (approvalData.success && approvalData.pendingUsers) {
        console.log('📋 Pending users:', approvalData.pendingUsers.length);
      }
    } else {
      console.error('❌ Approval API failed:', approvalResponse.status);
      const errorData = await approvalResponse.json();
      console.error('Error details:', errorData);
    }
    
    console.log('\n🎉 Login flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing login flow:', error.message);
  }
}

testLoginFlow(); 