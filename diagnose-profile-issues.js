const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log(
    'SUPABASE_SERVICE_ROLE_KEY:',
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  console.log(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY:',
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseUserProfileIssues() {
  const userId = '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170';

  console.log('🔍 Diagnosing User Profile Issues...\n');
  console.log('Target User ID:', userId);
  console.log('-------------------------------------------\n');

  try {
    // 1. Check if users table exists and has the user
    console.log('1️⃣ Checking users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);

    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
      console.log('   Details:', usersError);
    } else {
      console.log('✅ Users table accessible');
      console.log('   Found records:', usersData?.length || 0);
      if (usersData && usersData.length > 0) {
        console.log('   User data:', {
          id: usersData[0].id,
          email: usersData[0].email,
          status: usersData[0].status,
          role: usersData[0].role,
        });
      }
    }

    // 2. Check if profiles table exists and has the user
    console.log('\n2️⃣ Checking profiles table...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);

    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
      console.log('   Details:', profilesError);
    } else {
      console.log('✅ Profiles table accessible');
      console.log('   Found records:', profilesData?.length || 0);
      if (profilesData && profilesData.length > 0) {
        console.log('   Profile data:', {
          id: profilesData[0].id,
          email: profilesData[0].email,
          full_name: profilesData[0].full_name,
          status: profilesData[0].status,
          role: profilesData[0].role,
        });
      }
    }

    // 3. Check auth users
    console.log('\n3️⃣ Checking auth.users...');
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.log('❌ Auth users error:', authError.message);
    } else {
      console.log('✅ Auth users accessible');
      const targetUser = authUsers.users.find(u => u.id === userId);
      if (targetUser) {
        console.log('   Auth user found:', {
          id: targetUser.id,
          email: targetUser.email,
          email_confirmed_at: targetUser.email_confirmed_at,
          last_sign_in_at: targetUser.last_sign_in_at,
        });
      } else {
        console.log('   Auth user not found');
      }
    }

    // 4. Test the specific queries that are failing
    console.log('\n4️⃣ Testing failing queries...');

    // Test users query with select
    console.log('   Testing: users?select=status,role&id=eq.' + userId);
    const { data: usersSelect, error: usersSelectError } = await supabase
      .from('users')
      .select('status,role')
      .eq('id', userId);

    if (usersSelectError) {
      console.log('   ❌ Users select error:', usersSelectError.message);
    } else {
      console.log('   ✅ Users select success:', usersSelect);
    }

    // Test profiles query with select
    console.log('   Testing: profiles?select=status,role&id=eq.' + userId);
    const { data: profilesSelect, error: profilesSelectError } = await supabase
      .from('profiles')
      .select('status,role')
      .eq('id', userId);

    if (profilesSelectError) {
      console.log('   ❌ Profiles select error:', profilesSelectError.message);
    } else {
      console.log('   ✅ Profiles select success:', profilesSelect);
    }

    // 5. Check table schemas
    console.log('\n5️⃣ Checking table schemas...');

    const { data: usersCols, error: usersColsError } = await supabase.rpc(
      'get_table_columns',
      { table_name: 'users' }
    );

    if (usersColsError) {
      console.log('   Users columns error:', usersColsError.message);
    } else {
      console.log(
        '   Users columns:',
        usersCols?.map(col => col.column_name)
      );
    }

    const { data: profilesCols, error: profilesColsError } = await supabase.rpc(
      'get_table_columns',
      { table_name: 'profiles' }
    );

    if (profilesColsError) {
      console.log('   Profiles columns error:', profilesColsError.message);
    } else {
      console.log(
        '   Profiles columns:',
        profilesCols?.map(col => col.column_name)
      );
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

diagnoseUserProfileIssues();
