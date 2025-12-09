#!/usr/bin/env node

// Apply schema fix using Supabase client
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchemaFix() {
  console.log('🔧 Applying schema fix...\n');

  try {
    // Test the current problematic query first
    console.log('🧪 Testing current problematic query...');
    const { data: testData, error: testError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
        second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type)
      `
      )
      .limit(1);

    if (testError) {
      console.log('❌ Current query fails:', testError.message);
      console.log('   This confirms the schema mismatch issue\n');
    } else {
      console.log('✅ Current query works - no fix needed');
      return;
    }

    // Try the working schema query
    console.log('🧪 Testing working schema query...');
    const { data: workingData, error: workingError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        employer:parties!contracts_employer_id_fkey(id,name_en,name_ar,crn,type),
        client:parties!contracts_client_id_fkey(id,name_en,name_ar,crn,type)
      `
      )
      .limit(1);

    if (workingError) {
      console.log('❌ Working query also fails:', workingError.message);
    } else {
      console.log('✅ Working query succeeds - this is the correct schema\n');
    }

    console.log('📋 Summary:');
    console.log('   - Current schema uses: employer_id, client_id');
    console.log('   - Code expects: first_party_id, second_party_id');
    console.log('   - Solution: Update code to use correct column names\n');

    console.log('🔧 Recommended fix:');
    console.log(
      '   1. Update all queries to use employer_id/client_id instead of first_party_id/second_party_id'
    );
    console.log(
      '   2. Or create a database migration to add the missing columns'
    );
    console.log(
      '   3. The migration approach is safer for backward compatibility\n'
    );
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

applySchemaFix();
