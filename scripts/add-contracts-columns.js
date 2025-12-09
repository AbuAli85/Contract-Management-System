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

async function addContractsColumns() {
  console.log('🔄 Adding new columns to contracts table...');

  try {
    // Add new columns to contracts table
    console.log('1️⃣ Adding products_en column...');
    const { error: productsEnError } = await supabase
      .from('contracts')
      .select('products_en')
      .limit(1);

    if (productsEnError && productsEnError.code === '42703') {
      console.log('Adding products_en column...');
      // Column doesn't exist, we need to add it via SQL
      console.log(
        '⚠️ Column products_en does not exist. Please add it manually via SQL:'
      );
      console.log('ALTER TABLE contracts ADD COLUMN products_en TEXT;');
    } else {
      console.log('✅ products_en column already exists');
    }

    console.log('2️⃣ Adding products_ar column...');
    const { error: productsArError } = await supabase
      .from('contracts')
      .select('products_ar')
      .limit(1);

    if (productsArError && productsArError.code === '42703') {
      console.log(
        '⚠️ Column products_ar does not exist. Please add it manually via SQL:'
      );
      console.log('ALTER TABLE contracts ADD COLUMN products_ar TEXT;');
    } else {
      console.log('✅ products_ar column already exists');
    }

    console.log('3️⃣ Adding location_en column...');
    const { error: locationEnError } = await supabase
      .from('contracts')
      .select('location_en')
      .limit(1);

    if (locationEnError && locationEnError.code === '42703') {
      console.log(
        '⚠️ Column location_en does not exist. Please add it manually via SQL:'
      );
      console.log('ALTER TABLE contracts ADD COLUMN location_en TEXT;');
    } else {
      console.log('✅ location_en column already exists');
    }

    console.log('4️⃣ Adding location_ar column...');
    const { error: locationArError } = await supabase
      .from('contracts')
      .select('location_ar')
      .limit(1);

    if (locationArError && locationArError.code === '42703') {
      console.log(
        '⚠️ Column location_ar does not exist. Please add it manually via SQL:'
      );
      console.log('ALTER TABLE contracts ADD COLUMN location_ar TEXT;');
    } else {
      console.log('✅ location_ar column already exists');
    }

    console.log('5️⃣ Adding product_id column...');
    const { error: productIdError } = await supabase
      .from('contracts')
      .select('product_id')
      .limit(1);

    if (productIdError && productIdError.code === '42703') {
      console.log(
        '⚠️ Column product_id does not exist. Please add it manually via SQL:'
      );
      console.log(
        'ALTER TABLE contracts ADD COLUMN product_id UUID REFERENCES products(id);'
      );
    } else {
      console.log('✅ product_id column already exists');
    }

    console.log('6️⃣ Adding location_id column...');
    const { error: locationIdError } = await supabase
      .from('contracts')
      .select('location_id')
      .limit(1);

    if (locationIdError && locationIdError.code === '42703') {
      console.log(
        '⚠️ Column location_id does not exist. Please add it manually via SQL:'
      );
      console.log(
        'ALTER TABLE contracts ADD COLUMN location_id UUID REFERENCES locations(id);'
      );
    } else {
      console.log('✅ location_id column already exists');
    }

    console.log('\n📋 SQL Commands to run manually:');
    console.log(
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS products_en TEXT;'
    );
    console.log(
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS products_ar TEXT;'
    );
    console.log(
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location_en TEXT;'
    );
    console.log(
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location_ar TEXT;'
    );
    console.log(
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);'
    );
    console.log(
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);'
    );
  } catch (error) {
    console.error('❌ Error checking contracts table columns:', error);
  }
}

// Run the script
addContractsColumns();
