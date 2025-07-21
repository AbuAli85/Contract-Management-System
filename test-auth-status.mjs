// Test script to check authentication status
import { createClient } from '@supabase/supabase-js';

async function testAuthStatus() {
  console.log('🔍 Testing Authentication Status...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing Supabase environment variables');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('❌ No active session found');
      console.log('💡 Please log in first');
      return;
    }
    
    console.log('✅ User is authenticated');
    console.log('User ID:', session.user.id);
    console.log('User Email:', session.user.email);
    
    // Check if user exists in app_users table
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log('⚠️  User not found in app_users table');
        console.log('💡 This might be why you get 403 errors');
        console.log('💡 Try running the SQL script to disable RLS or add the user to app_users table');
      } else {
        console.log('❌ Error checking user data:', userError.message);
      }
    } else {
      console.log('✅ User found in app_users table');
      console.log('Role:', userData.role);
      console.log('Status:', userData.status);
    }
    
    // Test direct access to app_users table
    console.log('\n🧪 Testing direct access to app_users table...');
    const { data: allUsers, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .limit(5);
    
    if (fetchError) {
      console.log('❌ RLS policy error:', fetchError.message);
      console.log('💡 This confirms the RLS issue');
    } else {
      console.log('✅ Direct access successful');
      console.log('Users found:', allUsers?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testAuthStatus().catch(console.error); 