const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fixSignupIssues() {
  console.log('🔧 Fixing User Signup Issues...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
    return;
  }
  
  if (!supabaseServiceKey || supabaseServiceKey === 'REPLACE_WITH_ACTUAL_SERVICE_ROLE_KEY') {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not properly set in .env.local');
    console.error('📋 To fix this:');
    console.error('   1. Go to your Supabase Dashboard');
    console.error('   2. Navigate to Settings > API');
    console.error('   3. Copy the "service_role" key (NOT the anon key)');
    console.error('   4. Replace SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('   5. Restart your development server');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Step 1: Check database connection
    console.log('1. Testing database connection...');
    
    // First try to clear any problematic RLS policies
    console.log('   🧹 Clearing problematic RLS policies...');
    try {
      const clearPoliciesPath = path.join(__dirname, 'clear-rls-policies.sql');
      const clearPoliciesSQL = fs.readFileSync(clearPoliciesPath, 'utf8');
      
      const clearStatements = clearPoliciesSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of clearStatements) {
        if (statement.trim()) {
          try {
            await supabase.rpc('exec', { sql: statement });
          } catch (error) {
            // Ignore errors from clearing policies
            if (!error.message.includes('does not exist')) {
              console.log('   ⚠️  Clear policy warning:', error.message);
            }
          }
        }
      }
      console.log('   ✅ RLS policies cleared');
    } catch (error) {
      console.log('   ⚠️  Could not clear policies:', error.message);
    }
    
    // Now test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError && testError.message.includes('relation "users" does not exist')) {
      console.log('   ⚠️  Users table does not exist. Creating database schema...');
      await setupDatabaseSchema(supabase);
    } else if (testError && testError.message.includes('infinite recursion')) {
      console.log('   ⚠️  RLS infinite recursion detected. Fixing policies...');
      await setupDatabaseSchema(supabase);
    } else if (testError) {
      console.log('   ❌ Database connection failed:', testError.message);
      return;
    } else {
      console.log('   ✅ Database connection successful');
    }
    
    // Step 2: Check trigger function exists
    console.log('2. Checking trigger function...');
    const { data: triggerExists, error: triggerError } = await supabase
      .rpc('exec', {
        sql: `SELECT EXISTS(
          SELECT 1 FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
        ) as exists`
      });
    
    if (triggerError) {
      console.log('   ⚠️  Cannot check trigger function, will recreate it');
      await setupDatabaseSchema(supabase);
    } else if (!triggerExists || !triggerExists[0]?.exists) {
      console.log('   ⚠️  Trigger function missing, creating it...');
      await setupDatabaseSchema(supabase);
    } else {
      console.log('   ✅ Trigger function exists');
    }
    
    // Step 3: Test signup process
    console.log('3. Testing signup process...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'user',
          status: 'pending'
        }
      }
    });
    
    if (signupError) {
      console.log('   ❌ Signup failed:', signupError.message);
    } else {
      console.log('   ✅ Signup successful');
      
      if (signupData.user) {
        // Wait a moment for trigger to execute
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if user was created in database
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', testEmail)
          .single();
        
        if (userError) {
          console.log('   ❌ User not found in users table:', userError.message);
          console.log('   💡 This indicates the trigger function is not working properly');
        } else {
          console.log('   ✅ User record created in database');
          console.log('   📋 User details:', {
            email: userRecord.email,
            full_name: userRecord.full_name,
            role: userRecord.role,
            status: userRecord.status
          });
        }
        
        // Cleanup test user
        await supabase.auth.admin.deleteUser(signupData.user.id);
        console.log('   🧹 Test user cleaned up');
      }
    }
    
    console.log('\n✅ Signup system check completed!');
    console.log('📋 Next steps:');
    console.log('   1. Make sure you have the correct SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.log('   2. Restart your development server: npm run dev');
    console.log('   3. Try creating a new user account');
    console.log('   4. Check the browser console for any additional errors');
    
  } catch (error) {
    console.error('❌ Error during fix process:', error.message);
  }
}

async function setupDatabaseSchema(supabase) {
  console.log('   📝 Setting up database schema...');
  
  try {
    // First clear any problematic policies
    const clearPoliciesPath = path.join(__dirname, 'clear-rls-policies.sql');
    if (fs.existsSync(clearPoliciesPath)) {
      const clearPoliciesSQL = fs.readFileSync(clearPoliciesPath, 'utf8');
      const clearStatements = clearPoliciesSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of clearStatements) {
        if (statement.trim()) {
          try {
            await supabase.rpc('exec', { sql: statement });
          } catch (error) {
            // Ignore expected errors
            if (!error.message.includes('does not exist') && !error.message.includes('already exists')) {
              console.log('   ⚠️  Clear policy warning:', error.message);
            }
          }
        }
      }
    }
    
    // Read and execute the main SQL setup file
    const sqlPath = path.join(__dirname, 'fix-signup-database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split into statements and execute each one
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await supabase.rpc('exec', { sql: statement });
        } catch (error) {
          // Some statements might fail if they already exist, that's ok
          if (!error.message.includes('already exists') && !error.message.includes('does not exist')) {
            console.log('   ⚠️  Statement warning:', error.message);
          }
        }
      }
    }
    
    console.log('   ✅ Database schema setup completed');
  } catch (error) {
    console.error('   ❌ Failed to setup database schema:', error.message);
  }
}

// Run the fix
fixSignupIssues().catch(console.error);
