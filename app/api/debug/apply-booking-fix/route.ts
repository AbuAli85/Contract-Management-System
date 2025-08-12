import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST() {
  try {
    console.log('🔧 Starting booking schema fix...');

    // Read the migration file
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20250117_fix_booking_issues.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Migration file not found',
          details: `Expected file at: ${migrationPath}`,
        },
        { status: 404 }
      );
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(
      '📋 Loaded migration file, size:',
      migrationSQL.length,
      'chars'
    );

    // Apply individual SQL statements
    const results = [];

    // Key fixes to apply manually
    const fixes = [
      {
        name: 'Add notes column',
        sql: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;`,
      },
      {
        name: 'Add booking_number column',
        sql: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_number TEXT;`,
      },
      {
        name: 'Add scheduled_start column',
        sql: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ;`,
      },
      {
        name: 'Add scheduled_end column',
        sql: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ;`,
      },
      {
        name: 'Add provider_company_id column',
        sql: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_company_id UUID;`,
      },
      {
        name: 'Add total_price column',
        sql: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);`,
      },
      {
        name: 'Add currency column',
        sql: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';`,
      },
      {
        name: 'Add metadata column',
        sql: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';`,
      },
      {
        name: 'Update null booking_numbers',
        sql: `UPDATE bookings SET booking_number = 'BK-MIGR-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || id::TEXT WHERE booking_number IS NULL;`,
      },
      {
        name: 'Add unique constraint on booking_number',
        sql: `DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'bookings_booking_number_unique' 
            AND table_name = 'bookings'
          ) THEN
            ALTER TABLE bookings ADD CONSTRAINT bookings_booking_number_unique UNIQUE (booking_number);
          END IF;
        END $$;`,
      },
    ];

    for (const fix of fixes) {
      try {
        console.log(`⚡ Applying: ${fix.name}`);

        // For PostgreSQL, we need to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', { sql: fix.sql });

        if (error) {
          console.warn(`⚠️ ${fix.name} warning:`, error.message);
          results.push({
            name: fix.name,
            success: false,
            error: error.message,
            sql: fix.sql,
          });
        } else {
          console.log(`✅ ${fix.name} applied successfully`);
          results.push({
            name: fix.name,
            success: true,
            error: null,
            sql: fix.sql,
          });
        }
      } catch (err) {
        console.error(`❌ ${fix.name} failed:`, err);
        results.push({
          name: fix.name,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          sql: fix.sql,
        });
      }
    }

    // Test the fix by trying an upsert
    console.log('🧪 Testing upsert functionality...');
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
      booking_number: `BK-FIX-TEST-${Date.now()}`,
      status: 'pending',
      notes: 'Test booking created by schema fix',
      metadata: {
        test: true,
        fix_applied: true,
        timestamp: new Date().toISOString(),
      },
    };

    const { data: upsertResult, error: upsertError } = await supabase
      .from('bookings')
      .upsert(testPayload, {
        onConflict: 'booking_number',
        ignoreDuplicates: false,
      })
      .select('id, booking_number, status')
      .single();

    let upsertSuccess = false;
    if (upsertError) {
      console.log('❌ Upsert test failed:', upsertError.message);
      results.push({
        name: 'Upsert test',
        success: false,
        error: upsertError.message,
        sql: 'SELECT test upsert',
      });
    } else {
      console.log('✅ Upsert test successful:', upsertResult.booking_number);
      upsertSuccess = true;
      results.push({
        name: 'Upsert test',
        success: true,
        error: null,
        sql: 'SELECT test upsert',
        result: upsertResult,
      });

      // Clean up test data
      await supabase.from('bookings').delete().eq('id', upsertResult.id);
      console.log('🧹 Test data cleaned up');
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: successCount === totalCount && upsertSuccess,
      message: `Applied ${successCount}/${totalCount} fixes successfully`,
      results,
      summary: {
        total_fixes: totalCount,
        successful_fixes: successCount,
        failed_fixes: totalCount - successCount,
        upsert_working: upsertSuccess,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('💥 Schema fix failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply schema fixes',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
