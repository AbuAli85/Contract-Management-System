const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyContractsMigration() {
  console.log('🔄 Applying contracts table migration...');

  try {
    // Test if columns already exist
    console.log('1️⃣ Checking existing columns...');
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .limit(1);

    if (contractsError) {
      console.error('❌ Error accessing contracts table:', contractsError);
      return;
    }

    if (contracts && contracts.length > 0) {
      const existingColumns = Object.keys(contracts[0]);
      console.log('✅ Existing columns:', existingColumns);
      
      const requiredColumns = ['products_en', 'products_ar', 'location_en', 'location_ar', 'product_id', 'location_id'];
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('✅ All required columns already exist!');
        return;
      } else {
        console.log('❌ Missing columns:', missingColumns);
      }
    }

    // Since we can't run DDL directly, let's provide the SQL commands
    console.log('\n📋 SQL Commands to run manually in Supabase SQL Editor:');
    console.log('');
    console.log('-- Add new columns to contracts table');
    console.log('ALTER TABLE contracts');
    console.log('ADD COLUMN IF NOT EXISTS products_en TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS products_ar TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS location_en TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS location_ar TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),');
    console.log('ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);');
    console.log('');
    console.log('-- Add comments to the new columns');
    console.log("COMMENT ON COLUMN contracts.products_en IS 'Products/Services in English for Make.com integration';");
    console.log("COMMENT ON COLUMN contracts.products_ar IS 'Products/Services in Arabic for Make.com integration';");
    console.log("COMMENT ON COLUMN contracts.location_en IS 'Location in English for Make.com integration';");
    console.log("COMMENT ON COLUMN contracts.location_ar IS 'Location in Arabic for Make.com integration';");
    console.log("COMMENT ON COLUMN contracts.product_id IS 'Reference to products table';");
    console.log("COMMENT ON COLUMN contracts.location_id IS 'Reference to locations table';");

    console.log('\n🔧 Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL commands above');
    console.log('4. Run the commands');
    console.log('5. Verify the columns were added successfully');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

// Run the script
applyContractsMigration();
