#!/usr/bin/env node

/**
 * Database Schema Fix Script
 * This script checks and fixes common database schema issues
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

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...\n');

  try {
    // Check if profiles table exists and has correct structure
    console.log('1. Checking profiles table structure...');
    
    // Use a direct query to test if the table exists
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (testError) {
      if (testError.message.includes('relation "profiles" does not exist')) {
        console.error('❌ Profiles table does not exist!');
        console.log('   Creating profiles table...');
        await createProfilesTable();
        return;
      } else if (testError.message.includes('406')) {
        console.error('❌ 406 Not Acceptable error detected');
        console.log('   🔧 Fixing 406 error by recreating table...');
        await fix406Error();
        return;
      } else {
        console.error('❌ Error accessing profiles table:', testError.message);
        return;
      }
    }

    console.log('✅ Profiles table exists and is accessible');

    // Try to get table structure by querying a few rows
    console.log('\n2. Checking table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, created_at, updated_at')
      .limit(5);

    if (structureError) {
      console.error('❌ Error checking table structure:', structureError.message);
      
      // If there are column issues, show the fix
      if (structureError.message.includes('column') && structureError.message.includes('does not exist')) {
        console.log('\n🔧 Column structure issue detected!');
        console.log('   The table exists but is missing required columns.');
        console.log('   Please run the following SQL in your Supabase SQL Editor:');
        console.log('');
        console.log('   -- Drop and recreate the profiles table with correct structure');
        await createProfilesTable();
      }
    } else {
      console.log('✅ Table structure appears correct');
      if (structureData && structureData.length > 0) {
        console.log('   Sample data found:');
        structureData.forEach((row, index) => {
          console.log(`   Row ${index + 1}: ${row.email || 'no email'} (${row.role || 'no role'})`);
        });
      }
    }

    // Check for sample data
    console.log('\n3. Checking for sample data...');
    const { data: sampleProfiles, error: sampleError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5);

    if (sampleError) {
      console.error('❌ Error checking sample data:', sampleError.message);
    } else if (sampleProfiles && sampleProfiles.length > 0) {
      console.log(`✅ Found ${sampleProfiles.length} profile(s):`);
      sampleProfiles.forEach(profile => {
        console.log(`   - ${profile.email} (${profile.role})`);
      });
    } else {
      console.log('⚠️  No profiles found in the table');
    }

    // Test RLS by trying to insert a test profile
    console.log('\n4. Testing Row Level Security...');
    const testProfile = {
      id: 'test-' + Date.now(),
      email: 'test@example.com',
      role: 'user',
      full_name: 'Test User'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select();

    if (insertError) {
      console.error('❌ RLS test failed:', insertError.message);
      if (insertError.message.includes('new row violates row-level security policy')) {
        console.log('   🔧 RLS policies are working (this is good!)');
      }
    } else {
      console.log('✅ RLS test successful - inserted test profile');
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testProfile.id);
      
      if (deleteError) {
        console.log('   ⚠️  Could not clean up test profile');
      } else {
        console.log('   ✅ Test profile cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function createProfilesTable() {
  console.log('   Creating profiles table...');
  
  console.log('   📝 Please run the following SQL in your Supabase SQL Editor:');
  console.log('');
  console.log('   -- Drop existing table if it exists');
  console.log('   DROP TABLE IF EXISTS public.profiles CASCADE;');
  console.log('');
  console.log('   -- Create the profiles table');
  console.log('   CREATE TABLE public.profiles (');
  console.log('     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,');
  console.log('     email TEXT UNIQUE NOT NULL,');
  console.log('     first_name TEXT,');
  console.log('     last_name TEXT,');
  console.log('     role TEXT DEFAULT \'user\' CHECK (role IN (\'user\', \'admin\', \'manager\', \'promoter\', \'client\', \'provider\')),');
  console.log('     status TEXT DEFAULT \'pending\' CHECK (status IN (\'pending\', \'approved\', \'suspended\', \'deleted\')),');
  console.log('     avatar_url TEXT,');
  console.log('     bio TEXT,');
  console.log('     phone TEXT,');
  console.log('     company TEXT,');
  console.log('     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
  console.log('     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
  console.log('   );');
  console.log('');
  console.log('   -- Create indexes');
  console.log('   CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);');
  console.log('   CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);');
  console.log('   CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles(status);');
  console.log('');
  console.log('   -- Enable RLS');
  console.log('   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('   -- Grant permissions');
  console.log('   GRANT ALL ON public.profiles TO authenticated;');
  console.log('   GRANT ALL ON public.profiles TO anon;');
  console.log('');
  console.log('   -- Create basic RLS policies');
  console.log('   CREATE POLICY "Enable read access for authenticated users" ON public.profiles');
  console.log('   FOR SELECT USING (auth.role() = \'authenticated\');');
  console.log('');
  console.log('   CREATE POLICY "Enable insert for authenticated users" ON public.profiles');
  console.log('   FOR INSERT WITH CHECK (auth.uid() = id);');
  console.log('');
  console.log('   CREATE POLICY "Enable update for users based on id" ON public.profiles');
  console.log('   FOR UPDATE USING (auth.uid() = id);');
  console.log('');
  console.log('   -- Insert a test profile for the current user (if you have one)');
  console.log('   -- INSERT INTO public.profiles (id, email, role, full_name) VALUES (\'your-user-id\', \'your-email@example.com\', \'user\', \'Your Name\');');
  console.log('');
  console.log('   After running this SQL, restart your application.');
}

async function addMissingColumns(missingColumns) {
  console.log(`   Adding missing columns: ${missingColumns.join(', ')}`);
  
  console.log('   📝 Please run the following SQL in your Supabase SQL Editor:');
  console.log('');
  
  for (const column of missingColumns) {
    let columnDefinition = '';
    
    switch (column) {
      case 'id':
        columnDefinition = 'id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE';
        break;
      case 'email':
        columnDefinition = 'email TEXT UNIQUE NOT NULL';
        break;
      case 'role':
        columnDefinition = 'role TEXT DEFAULT \'user\' CHECK (role IN (\'user\', \'admin\', \'manager\', \'promoter\', \'client\', \'provider\'))';
        break;
      case 'full_name':
        columnDefinition = 'full_name TEXT';
        break;
      default:
        console.log(`   ⚠️  Unknown column: ${column}`);
        continue;
    }

    console.log(`   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${column} ${columnDefinition};`);
  }
  
  console.log('');
  console.log('   After running this SQL, restart your application.');
}

async function fix406Error() {
  console.log('   🔧 Attempting to fix 406 Not Acceptable error...');
  
  console.log('   📝 The 406 error usually means the table structure is corrupted.');
  console.log('   Please run this SQL in your Supabase SQL Editor:');
  console.log('');
  console.log('   -- Drop and recreate the profiles table');
  console.log('   DROP TABLE IF EXISTS public.profiles CASCADE;');
  console.log('');
  console.log('   Then run the createProfilesTable SQL commands above.');
  console.log('');
  console.log('   After running this SQL, restart your application.');
}

async function main() {
  console.log('🚀 Database Schema Fix Script\n');
  
  await checkDatabaseSchema();
  
  console.log('\n✅ Schema check completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. If you see SQL commands above, run them in your Supabase SQL Editor');
  console.log('2. After running SQL commands, restart your application');
  console.log('3. If you still have issues, check your Supabase environment variables');
  console.log('\n🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql/new');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkDatabaseSchema, createProfilesTable, addMissingColumns };
