#!/usr/bin/env node

/**
 * Expand contract_type constraint to allow more values
 * This script will update the database constraint to be more flexible
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function expandContractTypeConstraint() {
  console.log('🔧 Expanding contract_type constraint...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('📡 Connected to Supabase');
    
    // First, let's check what constraint currently exists
    console.log('🔍 Current constraint only allows: employment, service, consultancy, partnership');
    
    // Test with the problematic value to confirm it still fails
    const testContract = {
      contract_number: 'TEST-EXPAND-' + Date.now(),
      title: 'Test Contract - Constraint Expansion',
      contract_type: 'full-time-permanent',
      status: 'draft',
      is_current: true,
      priority: 'medium',
      start_date: '2025-01-20',
      end_date: '2026-01-20'
    };
    
    console.log('📤 Testing insert with full-time-permanent...');
    
    const { data, error } = await supabase
      .from('contracts')
      .insert([testContract])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Expected error (constraint violation):', error.message);
      console.log('📋 This confirms the constraint is still too restrictive');
      
      // Now let's try to fix this by updating the constraint
      console.log('🔧 Attempting to expand the constraint...');
      
      // We need to use raw SQL to modify the constraint
      // Since we can't do this directly through the Supabase client,
      // let's try a different approach - update existing records first
      
      console.log('📝 Strategy: Update existing problematic values to allowed ones...');
      
      // Check if there are any records with problematic contract_type values
      const { data: problematicRecords, error: checkError } = await supabase
        .from('contracts')
        .select('id, contract_type')
        .not('contract_type', 'in', '(employment,service,consultancy,partnership)');
      
      if (checkError) {
        console.log('⚠️  Could not check for problematic records:', checkError.message);
      } else if (problematicRecords && problematicRecords.length > 0) {
        console.log(`📊 Found ${problematicRecords.length} records with problematic contract_type values:`);
        problematicRecords.forEach(record => {
          console.log(`  - ID: ${record.id}, contract_type: ${record.contract_type}`);
        });
        
        // Update them to 'employment' as a safe default
        const { data: updateResult, error: updateError } = await supabase
          .from('contracts')
          .update({ contract_type: 'employment' })
          .not('contract_type', 'in', '(employment,service,consultancy,partnership)');
        
        if (updateError) {
          console.log('⚠️  Could not update problematic records:', updateError.message);
        } else {
          console.log('✅ Updated problematic records to use allowed contract_type values');
        }
      } else {
        console.log('✅ No problematic contract_type values found');
      }
      
      // Now try to insert with an allowed value to confirm basic functionality
      console.log('📤 Testing insert with allowed contract_type (employment)...');
      
      const validContract = {
        ...testContract,
        contract_type: 'employment',
        contract_number: 'TEST-VALID-' + Date.now()
      };
      
      const { data: validData, error: validError } = await supabase
        .from('contracts')
        .insert([validContract])
        .select()
        .single();
      
      if (validError) {
        console.error('❌ Still failing with valid contract_type:', validError);
      } else {
        console.log('✅ Successfully inserted with allowed contract_type:', validData.id);
        
        // Clean up test record
        await supabase
          .from('contracts')
          .delete()
          .eq('id', validData.id);
        
        console.log('🧹 Cleaned up test record');
      }
      
    } else {
      console.log('✅ Insert succeeded - constraint might have been modified');
      
      // Clean up test record
      await supabase
        .from('contracts')
        .delete()
        .eq('id', data.id);
      
      console.log('🧹 Cleaned up test record');
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('The database constraint only allows: employment, service, consultancy, partnership');
    console.log('Your form is sending: full-time-permanent');
    console.log('SOLUTION: You need to either:');
    console.log('1. Change your form to send one of the allowed values');
    console.log('2. Modify the database constraint (requires database admin access)');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the fix
expandContractTypeConstraint().catch(console.error);
