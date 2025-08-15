#!/usr/bin/env node

/**
 * Deep Diagnosis Script
 * This script performs detailed analysis of the profiles table and authentication
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deepDiagnosis() {
  console.log('🔍 Deep Diagnosis of Profiles Table...\n');

  try {
    // 1. Check exact column names and types
    console.log('1. Checking exact column structure...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Sample data query failed:', sampleError.message);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      const sampleRow = sampleData[0];
      console.log('   Sample row structure:');
      Object.entries(sampleRow).forEach(([key, value]) => {
        console.log(`     ${key}: ${typeof value} = ${value}`);
      });
    } else {
      console.log('   ⚠️  No data in profiles table');
    }

    // 2. Test the exact query that's failing in your app
    console.log('\n2. Testing the exact query from your app...');
    
    // This is the query from your check-session API
    const { data: appQueryData, error: appQueryError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .limit(1);

    if (appQueryError) {
      console.error('   ❌ App query failed:', appQueryError.message);
      
      // Try different column combinations
      console.log('\n   🔍 Testing alternative column combinations...');
      
      const alternatives = [
        ['id', 'email', 'role'],
        ['id', 'email'],
        ['id'],
        ['*']
      ];

      for (const columns of alternatives) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select(columns.join(', '))
            .limit(1);
          
          if (error) {
            console.log(`     ❌ ${columns.join(', ')}: ${error.message}`);
          } else {
            console.log(`     ✅ ${columns.join(', ')}: works`);
          }
        } catch (err) {
          console.log(`     ❌ ${columns.join(', ')}: ${err.message}`);
        }
      }
    } else {
      console.log('   ✅ App query works');
    }

    // 3. Test with a real UUID
    console.log('\n3. Testing with real UUID format...');
    
    // Get a real user ID from auth.users if possible
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);

    if (authError) {
      console.log('   ⚠️  Cannot access auth.users directly');
      
      // Try to create a profile with a proper UUID
      const properUUID = '00000000-0000-0000-0000-000000000001';
      const testProfile = {
        id: properUUID,
        email: 'test-deep@example.com',
        role: 'user'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert(testProfile)
        .select();

      if (insertError) {
        console.log('   ❌ Insert with proper UUID failed:', insertError.message);
      } else {
        console.log('   ✅ Insert with proper UUID successful');
        
        // Clean up
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', properUUID);
        
        if (deleteError) {
          console.log('   ⚠️  Could not clean up test profile');
        }
      }
    }

    // 4. Check RLS policies
    console.log('\n4. Testing RLS policies...');
    
    // Try to query as anon user
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: anonData, error: anonError } = await anonClient
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (anonError) {
      console.log('   ❌ Anon user query failed:', anonError.message);
    } else {
      console.log('   ✅ Anon user query works (RLS might be too permissive)');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function main() {
  console.log('🚀 Deep Diagnosis Script\n');
  
  await deepDiagnosis();
  
  console.log('\n✅ Deep diagnosis completed!');
  console.log('\n📋 Analysis:');
  console.log('• If app query fails but basic select works, there\'s a column name issue');
  console.log('• If UUID insert fails, there\'s a constraint issue');
  console.log('• If anon user can query, RLS policies might be too permissive');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { deepDiagnosis };
