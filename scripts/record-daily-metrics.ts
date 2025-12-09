/**
 * Script to Record Daily Metrics
 *
 * Run this script daily (via cron job or scheduled task) to record
 * historical snapshots of key metrics for trend analysis
 *
 * Usage:
 *   npm run record-metrics
 *   OR
 *   node scripts/record-daily-metrics.ts
 */

import { createClient } from '@supabase/supabase-js';

async function recordDailyMetrics() {
  console.log('🕒 Starting daily metrics recording...');
  console.log(`📅 Date: ${new Date().toISOString()}`);

  // Initialize Supabase client with service role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    console.error(
      'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Call the database function to record metrics
    const { data, error } = await supabase.rpc('record_daily_metrics');

    if (error) {
      console.error('❌ Error recording metrics:', error.message);
      process.exit(1);
    }

    console.log('✅ Daily metrics recorded successfully!');
    console.log('📊 Metrics captured:');
    console.log('   - Total Promoters');
    console.log('   - Active Promoters');
    console.log('   - Critical Documents');
    console.log('   - Compliance Rate');
    console.log('   - Total Contracts');
    console.log('   - Active Contracts');

    // Verify the data was inserted
    const { data: verification, error: verifyError } = await supabase
      .from('metrics_history')
      .select('metric_type, metric_name, metric_value')
      .eq('snapshot_date', new Date().toISOString().split('T')[0])
      .order('metric_type', { ascending: true });

    if (verifyError) {
      console.error('⚠️  Could not verify metrics:', verifyError.message);
    } else if (verification) {
      console.log('\n📋 Verification:');
      verification.forEach(metric => {
        console.log(
          `   ${metric.metric_type}.${metric.metric_name} = ${metric.metric_value}`
        );
      });
    }

    console.log('\n🎉 Metrics recording complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
recordDailyMetrics();
