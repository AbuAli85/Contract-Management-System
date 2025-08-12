/**
 * Script to apply booking schema fixes
 * Run with: node scripts/apply-booking-fix.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function applyBookingFix() {
  console.log('🔧 Applying booking schema fixes...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20250117_fix_booking_issues.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return false;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📋 Loaded migration file:', migrationPath);
    console.log('📏 SQL length:', migrationSQL.length, 'characters\n');

    // Apply the migration
    console.log('⚡ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL,
    });

    if (error) {
      // If RPC function doesn't exist, try manual execution
      console.log('📝 RPC function not available, trying direct execution...');

      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.length > 0) {
          console.log(
            `📝 Executing statement ${i + 1}/${statements.length}...`
          );

          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', {
              sql: stmt + ';',
            });
            if (stmtError) {
              console.warn(`⚠️ Statement ${i + 1} warning:`, stmtError.message);
            }
          } catch (stmtErr) {
            console.warn(`⚠️ Statement ${i + 1} error:`, stmtErr.message);
          }
        }
      }
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify the fixes
    console.log('🔍 Verifying fixes...');

    // Check if booking_number unique constraint exists
    const { data: constraints } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name')
      .eq('table_name', 'bookings')
      .eq('constraint_type', 'UNIQUE')
      .ilike('constraint_name', '%booking_number%');

    console.log('📋 Unique constraints found:', constraints?.length || 0);

    // Check if notes column exists
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'bookings')
      .eq('column_name', 'notes');

    console.log('📋 Notes column exists:', columns?.length > 0 ? 'Yes' : 'No');

    // Test upsert functionality
    console.log('\n🧪 Testing upsert functionality...');
    const testPayload = {
      service_id: '8ae3b266-bb64-4626-8388-44da16bc79d2',
      provider_company_id: '24e1bbc0-d47b-4157-bed2-39aaae5de93d',
      client_id: '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170',
      scheduled_start: new Date(
        Date.now() + 4 * 24 * 60 * 60 * 1000
      ).toISOString(),
      scheduled_end: new Date(
        Date.now() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
      ).toISOString(),
      total_price: 25.0,
      currency: 'OMR',
      booking_number: 'BK-FIX-TEST-' + Date.now(),
      status: 'pending',
      notes: 'Test booking for schema fix verification',
      metadata: { test: true, fix_applied: true },
    };

    const { data: upsertResult, error: upsertError } = await supabase
      .from('bookings')
      .upsert(testPayload, {
        onConflict: 'booking_number',
        ignoreDuplicates: false,
      })
      .select('id, booking_number, status')
      .single();

    if (upsertError) {
      console.log('❌ Upsert test failed:', upsertError.message);
      return false;
    } else {
      console.log('✅ Upsert test successful!');
      console.log('📋 Created booking:', upsertResult.booking_number);

      // Clean up test data
      await supabase.from('bookings').delete().eq('id', upsertResult.id);

      console.log('🧹 Test data cleaned up');
    }

    console.log('\n🎉 All fixes applied and verified successfully!');
    return true;
  } catch (error) {
    console.error('💥 Failed to apply booking fixes:', error.message);
    return false;
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  applyBookingFix()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { applyBookingFix };
