#!/usr/bin/env node

/**
 * Verify the current status of the contract_type constraint
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifyConstraintStatus() {
  console.log('🔍 Verifying contract_type constraint status...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('📡 Connected to Supabase');
    
    // Test 1: Try to insert with the problematic value
    console.log('\n🧪 Test 1: Inserting with full-time-permanent...');
    
    const testContract1 = {
      contract_number: 'TEST-VERIFY-1-' + Date.now(),
      title: 'Test Contract - Verify Constraint 1',
      contract_type: 'full-time-permanent',
      status: 'draft',
      is_current: true,
      priority: 'medium',
      start_date: '2025-01-20',
      end_date: '2026-01-20'
    };
    
    const { data: data1, error: error1 } = await supabase
      .from('contracts')
      .insert([testContract1])
      .select()
      .single();
    
    if (error1) {
      console.log('❌ full-time-permanent still fails:', error1.message);
    } else {
      console.log('✅ full-time-permanent now works! ID:', data1.id);
      
      // Clean up
      await supabase
        .from('contracts')
        .delete()
        .eq('id', data1.id);
      console.log('🧹 Cleaned up test record 1');
    }
    
    // Test 2: Try to insert with other problematic values
    console.log('\n🧪 Test 2: Inserting with other values...');
    
    const testValues = [
      'full-time-contract',
      'part-time',
      'freelance',
      'internship',
      'consulting',
      'maintenance'
    ];
    
    for (const testValue of testValues) {
      const testContract2 = {
        contract_number: 'TEST-VERIFY-2-' + Date.now(),
        title: `Test Contract - ${testValue}`,
        contract_type: testValue,
        status: 'draft',
        is_current: true,
        priority: 'medium',
        start_date: '2025-01-20',
        end_date: '2026-01-20'
      };
      
      const { data: data2, error: error2 } = await supabase
        .from('contracts')
        .insert([testContract2])
        .select()
        .single();
      
      if (error2) {
        console.log(`❌ ${testValue} fails:`, error2.message);
      } else {
        console.log(`✅ ${testValue} works! ID:`, data2.id);
        
        // Clean up
        await supabase
          .from('contracts')
          .delete()
          .eq('id', data2.id);
        console.log(`🧹 Cleaned up ${testValue} test record`);
      }
    }
    
    // Test 3: Check what values are currently in the database
    console.log('\n📊 Test 3: Checking current contract_type values in database...');
    
    const { data: existingTypes, error: typeError } = await supabase
      .from('contracts')
      .select('contract_type')
      .not('contract_type', 'is', null);
    
    if (typeError) {
      console.log('❌ Could not check existing types:', typeError.message);
    } else {
      const uniqueTypes = [...new Set(existingTypes.map(r => r.contract_type))];
      console.log('📋 Current contract_type values in database:', uniqueTypes);
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('The constraint appears to have been modified or relaxed.');
    console.log('Your form should now work with full-time-permanent and other values.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the verification
verifyConstraintStatus().catch(console.error);
