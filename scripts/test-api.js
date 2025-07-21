const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAPI() {
  try {
    console.log('🔍 Testing API authentication...');
    
    // First, let's sign in with the user
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'luxsess2001@gmail.com',
      password: 'your-password-here' // You'll need to provide the actual password
    });
    
    if (signInError) {
      console.error('❌ Sign in error:', signInError);
      return;
    }
    
    console.log('✅ Signed in successfully:', {
      userId: user?.id,
      userEmail: user?.email
    });
    
    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    console.log('✅ Session obtained:', {
      hasSession: !!session,
      accessToken: session?.access_token ? 'Present' : 'Missing'
    });
    
    // Test the API endpoint
    console.log('🔍 Testing /api/users endpoint...');
    
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Success:', data);
    } else {
      const errorData = await response.text();
      console.log('❌ API Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAPI(); 