// Check parties table structure
// Run with: node scripts/check_parties_table_structure.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPartiesTable() {
  console.log('🔍 Checking parties table structure...\n');

  try {
    // Get a sample record to see column names
    const { data: sampleData, error: sampleError } = await supabase
      .from('parties')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
      return;
    }

    if (!sampleData || sampleData.length === 0) {
      console.log('⚠️ No data found in parties table');
      return;
    }

    const columns = Object.keys(sampleData[0]);
    console.log('📋 Parties table columns:');
    columns.forEach(col => console.log(`   - ${col}`));

    // Check for expiry-related columns
    const expiryColumns = columns.filter(col => 
      col.toLowerCase().includes('expiry') || 
      col.toLowerCase().includes('expire') ||
      col.toLowerCase().includes('cr_')
    );

    console.log('\n🔍 Expiry-related columns:');
    if (expiryColumns.length > 0) {
      expiryColumns.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('   No expiry-related columns found');
    }

    // Check if cr_expiry exists
    if (columns.includes('cr_expiry')) {
      console.log('\n✅ cr_expiry column exists');
    } else {
      console.log('\n❌ cr_expiry column does not exist');
      console.log('   Available columns that might be related:');
      columns.filter(col => col.toLowerCase().includes('cr')).forEach(col => {
        console.log(`   - ${col}`);
      });
    }

    // Check for license_expiry
    if (columns.includes('license_expiry')) {
      console.log('\n✅ license_expiry column exists');
    } else {
      console.log('\n❌ license_expiry column does not exist');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPartiesTable().catch(console.error); 