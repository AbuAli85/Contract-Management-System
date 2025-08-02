require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkProfilesSchema() {
  try {
    console.log('🔍 Checking profiles table schema...');
    
    // Get a sample record to see available columns
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying profiles:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Available columns in profiles table:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => console.log(`  - ${col}`));
      
      // Check if department column exists
      if (columns.includes('department')) {
        console.log('✅ Department column exists');
      } else {
        console.log('❌ Department column does NOT exist');
      }
    } else {
      console.log('⚠️  No data found in profiles table');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkProfilesSchema();
